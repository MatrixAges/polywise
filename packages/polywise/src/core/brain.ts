import { catchFinally } from 'shared'
import { injectable } from 'tsyringe'

import { system } from '../consts'
import sql from '../sql'
import { execSql, getContextEdgeWeight, querySql } from '../utils'

import type { BrainState, Edge, SequenceFrontierItem, SequenceScore } from '../types'
import type Polywise from './polywise'

@injectable()
export default class Index {
	private p!: Polywise

	private state: BrainState = 'FRESH'
	private last_user_interaction = Date.now()
	private last_context_id: string | null = null
	private current_fatigue = 0

	private is_busy = false
	private is_loop_running = false
	private is_disposed = false
	private timer?: NodeJS.Timeout

	init(p: Polywise) {
		this.p = p
		this.startLifeCycleLoop()
	}

	busy(v?: boolean) {
		this.is_busy = v ?? true
	}

	report(context_id?: string) {
		this.last_user_interaction = Date.now()
		if (context_id) this.last_context_id = context_id
	}

	updateState() {
		if (this.current_fatigue > system.fatigue_threshold && this.state === 'FRESH') {
			this.state = 'TIRED'
		}
	}

	addSynapticLoad(load: number) {
		this.current_fatigue += load
		this.updateState()
	}

	private startLifeCycleLoop() {
		this.timer = setInterval(() => {
			void this.runLifeCycleLoop()
		}, system.shadow_interval_ms)
	}

	private runLifeCycleLoop = async () => {
		if (this.is_disposed) return
		if (this.is_loop_running) return
		if (this.is_busy) return

		this.is_loop_running = true

		try {
			const is_idle = this.isIdle()
			const is_deep_idle = this.isIdle(true)

			if (is_deep_idle && this.state !== 'SLEEPING' && this.state !== 'LEARNING') {
				await execSql(this.p.db, sql.brain.sql_memory_reorganization)
				await this.applyContextSequenceReplay()
				return
			}

			if (this.state === 'TIRED' && is_idle) {
				await this.triggerSleepTick()
				return
			}

			if (this.state === 'SLEEPING' || this.state === 'LEARNING') return

			await this.runShadowTick()
		} finally {
			this.is_loop_running = false
		}
	}

	@catchFinally<Index>(ctx => ctx.busy(false))
	async triggerInputBurst(load = 50) {
		if (this.is_disposed) return
		if (this.is_busy) return

		this.busy(true)

		const prev_state = this.state
		this.state = 'LEARNING'

		this.report()
		this.addSynapticLoad(load)

		for (let index = 0; index < 100; index++) {
			if (this.is_disposed) break
			await this.tick(0.3, true, 1.0)
			await new Promise(resolve => setTimeout(resolve, 50))
		}

		this.state = prev_state === 'SLEEPING' ? 'FRESH' : prev_state
		this.updateState()
	}

	@catchFinally<Index>(ctx => ctx.busy(false))
	private async triggerSleepTick() {
		if (this.is_disposed) return
		if (this.is_busy) return

		this.busy(true)

		const prev_state = this.state
		this.state = 'SLEEPING'

		this.p.logger.log('SYSTEM', 'triggerSleepTick start')

		try {
			const res = await querySql<{ count: number }>(this.p.db, sql.brain.sql_get_active_node_count)
			const active_count = res[0]?.count ?? 0

			this.p.logger.log('SYSTEM', 'triggerSleepTick check', () => ({
				active_count,
				limit: system.max_active_limit
			}))

			const is_overloaded = active_count > system.max_active_limit

			if (!is_overloaded) {
				this.p.logger.log('SYSTEM', 'triggerSleepTick skipped - not overloaded')
				this.state = prev_state === 'LEARNING' ? 'FRESH' : prev_state
				return
			}

			const sequence_scores = await this.getContextSequenceScores()
			const selected_scores = sequence_scores
				.filter(score_item => score_item.score >= system.context_sequence_replay_min_score)
				.slice(0, system.context_sequence_replay_limit)

			const context_ids = selected_scores.map(score_item => score_item.context_id)
			const context_scores = selected_scores.map(score_item => score_item.score)

			await execSql(this.p.db, sql.meta.sql_begin)

			try {
				await execSql(this.p.db, sql.brain.sql_sleep_tick_clean_noise)
				await execSql(this.p.db, sql.brain.sql_sleep_tick_decay_nodes)
				await execSql(this.p.db, sql.brain.sql_sleep_tick_decay_edges)
				await querySql(this.p.db, sql.brain.sql_sleep_tick_replay, [context_ids, context_scores])
				await execSql(this.p.db, sql.meta.sql_commit)
			} catch (error) {
				await execSql(this.p.db, sql.meta.sql_rollback)

				throw error
			}

			this.current_fatigue = 0
			this.state = 'FRESH'

			this.p.logger.log('SYSTEM', 'triggerSleepTick completed')
		} catch (error) {
			this.state = prev_state === 'LEARNING' ? 'FRESH' : prev_state

			throw error
		}
	}

	private tick = async (threshold_override?: number, is_learning = false, arousal = 1.0) => {
		const threshold = threshold_override ?? system.default_node_threshold

		const active_res = await querySql<{ count: number }>(this.p.db, sql.brain.sql_get_active_node_count)

		const active_count = active_res[0]?.count ?? 0

		const heat = Math.min(1.0, active_count / system.max_active_limit)
		const threshold_decrement = system.max_threshold_decay_step * (1.0 - heat)

		const inhibition_factor = Math.min(
			system.global_inhibition_max,
			Math.max(0, heat * system.global_inhibition_max)
		)

		await execSql(
			this.p.db,
			sql.simulation.sql_propagate(threshold, threshold_decrement, is_learning, arousal, inhibition_factor)
		)

		await execSql(this.p.db, sql.stat.sql_increment_input_count)

		const count_res = await querySql<{ value: number }>(this.p.db, sql.stat.sql_get_input_count)
		const count = count_res[0]?.value ?? 0

		if (count <= system.input_decay_threshold) return

		await execSql(this.p.db, sql.simulation.sql_decay)
		await execSql(this.p.db, sql.stat.sql_reset_input_count)
	}

	private applyContextSequenceReplay = async () => {
		const sequence_scores = await this.getContextSequenceScores()
		if (!sequence_scores.length) return

		const filtered_scores = sequence_scores.filter(
			score_item => score_item.score >= system.context_sequence_replay_min_score
		)

		if (!filtered_scores.length) return

		const selected_scores = filtered_scores.slice(0, system.context_sequence_replay_limit)

		let max_score = 0

		for (const score_item of selected_scores) {
			if (score_item.score > max_score) max_score = score_item.score
		}

		if (max_score <= 0) return

		for (const score_item of selected_scores) {
			const replay_strength = system.context_sequence_replay_strength * (score_item.score / max_score)

			await querySql(this.p.db, sql.brain.sql_strengthen_edges_by_context, [
				replay_strength,
				[score_item.context_id]
			])
		}
	}

	private getContextSequenceScores = async () => {
		if (!this.last_context_id) return [] as Array<SequenceScore>

		const scores = new Map<string, number>()

		let frontier = [
			{
				context_id: this.last_context_id,
				base_score: 1,
				path_ids: new Set<string>([this.last_context_id])
			}
		] as Array<SequenceFrontierItem>

		for (let step = 0; step < system.context_sequence_depth; step++) {
			if (!frontier.length) break

			const source_ids = frontier.map(item => item.context_id)

			const edges = await this.getContextEdgesBySources(source_ids, system.context_sequence_branch)
			if (!edges.length) break

			const edge_map = new Map<string, Array<Edge>>()
			for (const edge of edges) {
				if (!edge.source_id) continue
				const list = edge_map.get(edge.source_id) ?? []
				list.push(edge)
				edge_map.set(edge.source_id, list)
			}

			const hop_decay = Math.pow(system.context_sequence_hop_decay, step)
			const next_frontier = [] as Array<SequenceFrontierItem>

			for (const item of frontier) {
				const source_edges = edge_map.get(item.context_id) ?? []
				if (!source_edges.length) continue

				for (const edge of source_edges) {
					if (!edge.target_id) continue

					const edge_weight = getContextEdgeWeight(edge)
					if (edge_weight <= 0) continue

					const score = item.base_score * edge_weight * hop_decay
					const previous_score = scores.get(edge.target_id) ?? 0
					scores.set(edge.target_id, previous_score + score)

					if (step + 1 >= system.context_sequence_depth) continue
					if (item.path_ids.has(edge.target_id)) continue

					const next_path_ids = new Set<string>(item.path_ids)
					next_path_ids.add(edge.target_id)

					next_frontier.push({
						context_id: edge.target_id,
						base_score: item.base_score * edge_weight,
						path_ids: next_path_ids
					})
				}
			}

			frontier = next_frontier
		}

		const sorted_scores = Array.from(scores.entries()).sort(
			(left_entry, right_entry) => right_entry[1] - left_entry[1]
		)

		return sorted_scores.map(([context_id, score]) => ({ context_id, score }))
	}

	private getContextEdgesBySources = async (source_ids: Array<string>, branch_limit: number) => {
		if (!source_ids.length) return [] as Array<Edge>

		return querySql<Edge>(this.p.db, sql.context.sql_get_context_edges_by_sources, [source_ids, branch_limit])
	}

	private runShadowTick = async () => {
		await execSql(this.p.db, sql.brain.sql_run_shadow_tick)
		await this.tick(0.8, true, 0.5)
	}

	private isIdle(deep?: boolean) {
		const idle_ms = Date.now() - this.last_user_interaction
		const threshold_ms = deep ? system.idle_decay_threshold_ms : system.idle_timeout_ms

		return idle_ms > threshold_ms
	}

	off() {
		this.is_disposed = true

		if (this.timer) {
			clearInterval(this.timer)

			this.timer = undefined
		}
	}
}
