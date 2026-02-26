import { catchFinally } from 'shared'
import { injectable } from 'tsyringe'

import { system } from '../consts'
import sql from '../sql'
import { execSql, getContextEdgeWeight, querySql } from '../utils'

import type { BrainState, Edge } from '../types'
import type Polywise from './polywise'

@injectable()
export default class Index {
	private p!: Polywise

	private state: BrainState = 'FRESH'
	private last_user_interaction = Date.now()
	private last_context_id: string | null = null
	private current_fatigue = 0
	private is_busy = false
	private shadow_interval?: NodeJS.Timeout

	init(p: Polywise) {
		this.p = p

		this.startLifeCycleLoop()
	}

	busy(v?: boolean) {
		this.is_busy = v ?? true
	}

	report() {
		this.last_user_interaction = Date.now()
	}

	updateState() {
		if (this.current_fatigue > system.activation.fatigue_threshold && this.state === 'FRESH') {
			this.state = 'TIRED'
		}
	}

	addSynapticLoad(load: number) {
		this.current_fatigue += load

		this.updateState()
	}

	private startLifeCycleLoop() {
		this.shadow_interval = setInterval(async () => {
			if (this.is_busy) return

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

			if (this.state !== 'SLEEPING' && this.state !== 'LEARNING') {
				await this.runShadowTick()
			}
		}, system.timing.shadow_interval_ms)
	}

	@catchFinally<Index>(ctx => ctx.busy(false))
	async triggerInputBurst(load = 50) {
		const prev_state = this.state

		this.state = 'LEARNING'

		this.report()
		this.addSynapticLoad(load)

		for (let i = 0; i < 100; i++) {
			await this.tick(0.3, true, 1.0)

			await new Promise(resolve => setTimeout(resolve, 50))
		}

		this.state = prev_state === 'SLEEPING' ? 'FRESH' : prev_state

		this.updateState()
	}

	@catchFinally<Index>(ctx => ctx.busy(false))
	private async triggerSleepTick() {
		this.p.logger.log('SYSTEM', 'triggerSleepTick start')

		this.state = 'SLEEPING'

		const res = await querySql<{ count: number }>(this.p.db, sql.brain.sql_get_active_node_count)

		const active_count = res[0]?.count ?? 0

		this.p.logger.log('SYSTEM', 'triggerSleepTick check', () => ({
			active_count,
			limit: system.shy.max_active_limit
		}))

		const is_overloaded = active_count > system.shy.max_active_limit

		if (!is_overloaded) return this.p.logger.log('SYSTEM', 'triggerSleepTick skipped - not overloaded')

		this.p.logger.log('SYSTEM', 'triggerSleepTick executing - cognitive overload detected')

		const sequence_scores = await this.getContextSequenceScores()

		const selected_scores = sequence_scores
			.filter(score_item => score_item.score >= system.context.context_sequence_replay_min_score)
			.slice(0, system.context.context_sequence_replay_limit)

		const context_ids = selected_scores.map(score_item => score_item.context_id)
		const context_scores = selected_scores.map(score_item => score_item.score)

		await execSql(this.p.db, sql.brain.sql_sleep_tick_begin)
		await execSql(this.p.db, sql.brain.sql_sleep_tick_clean_noise)
		await execSql(this.p.db, sql.brain.sql_sleep_tick_decay_nodes)
		await execSql(this.p.db, sql.brain.sql_sleep_tick_decay_edges)
		await querySql(this.p.db, sql.brain.sql_sleep_tick_replay, [context_ids, context_scores])
		await execSql(this.p.db, sql.brain.sql_sleep_tick_commit)

		this.current_fatigue = 0
		this.state = 'FRESH'

		this.p.logger.log('SYSTEM', 'triggerSleepTick completed')
	}

	/**
	 * Executes a simulation tick for the neural network.
	 *
	 * Biological Mechanism:
	 * 1. Integrate: Nodes accumulate potential from incoming signals.
	 * 2. Fire: If potential > node.threshold (Activation), the node fires (is_active=true).
	 * 3. Propagate: Active nodes send signals to neighbors via edges.
	 * 4. Reset: Active nodes enter a refractory period (potential resets).
	 * 5. Decay: Inactive nodes lose potential over time (Leak).
	 */
	private async tick(threshold_override?: number, is_learning: boolean = false, arousal: number = 1.0) {
		const threshold = threshold_override ?? system.default_config.default_node_threshold

		const active_res = await querySql<{ count: number }>(this.p.db, sql.brain.sql_get_active_node_count)

		const active_count = active_res[0]?.count ?? 0
		const heat = Math.min(1.0, active_count / system.shy.max_active_limit)
		const threshold_decrement = system.shy.max_threshold_decay_step * (1.0 - heat)

		const inhibition_factor = Math.min(
			system.tick.global_inhibition_max,
			Math.max(0, heat * system.tick.global_inhibition_max)
		)

		await execSql(
			this.p.db,
			sql.simulation.sql_propagate(threshold, threshold_decrement, is_learning, arousal, inhibition_factor)
		)

		await execSql(this.p.db, sql.stat.sql_increment_input_count)

		const count_res = await querySql<{ value: number }>(this.p.db, sql.stat.sql_get_input_count)

		const count = count_res[0]?.value ?? 0

		if (count > system.tick.input_decay_threshold) {
			await execSql(this.p.db, sql.simulation.sql_decay)
			await execSql(this.p.db, sql.stat.sql_reset_input_count)
		}
	}

	private async applyContextSequenceReplay() {
		const sequence_scores = await this.getContextSequenceScores()

		if (!sequence_scores.length) return

		const filtered_scores = sequence_scores.filter(
			score_item => score_item.score >= system.context.context_sequence_replay_min_score
		)

		if (!filtered_scores.length) return

		const selected_scores = filtered_scores.slice(0, system.context.context_sequence_replay_limit)

		let max_score = 0

		for (const score_item of selected_scores) {
			if (score_item.score > max_score) {
				max_score = score_item.score
			}
		}

		if (max_score <= 0) return

		for (const score_item of selected_scores) {
			const replay_strength =
				system.context.context_sequence_replay_strength * (score_item.score / max_score)

			await querySql(this.p.db, sql.brain.sql_strengthen_edges_by_context, [
				replay_strength,
				[score_item.context_id]
			])
		}
	}

	private async getContextSequenceScores() {
		if (!this.last_context_id) return []

		const scores = new Map<string, number>()
		const path_ids = new Set<string>()

		path_ids.add(this.last_context_id)

		await this.collectSequenceScores({
			source_id: this.last_context_id,
			depth: system.context.context_sequence_depth,
			step: 0,
			base_score: 1,
			scores,
			path_ids
		})

		const sorted_scores = Array.from(scores.entries()).sort(
			(left_entry, right_entry) => right_entry[1] - left_entry[1]
		)

		return sorted_scores.map(([context_id, score]) => ({ context_id, score }))
	}

	private async collectSequenceScores(args: {
		source_id: string
		depth: number
		step: number
		base_score: number
		scores: Map<string, number>
		path_ids: Set<string>
	}) {
		const { source_id, depth, step, base_score, scores, path_ids } = args

		if (step >= depth) return

		const edges = await querySql<Edge>(this.p.db, sql.context.sql_get_context_edges_by_source, [
			source_id,
			system.context.context_sequence_branch
		])

		if (edges.length === 0) return

		const hop_decay = Math.pow(system.context.context_sequence_hop_decay, step)

		await this.applySequenceEdges({
			edges,
			depth,
			step,
			base_score,
			hop_decay,
			scores,
			path_ids
		})
	}

	private async applySequenceEdges(args: {
		edges: Array<Edge>
		depth: number
		step: number
		base_score: number
		hop_decay: number
		scores: Map<string, number>
		path_ids: Set<string>
	}) {
		const { edges, depth, step, base_score, hop_decay, scores, path_ids } = args

		for (const edge of edges) {
			if (!edge.target_id) continue

			const edge_weight = getContextEdgeWeight(edge)

			if (edge_weight <= 0) continue

			const score = base_score * edge_weight * hop_decay
			const previous_score = scores.get(edge.target_id) ?? 0
			scores.set(edge.target_id, previous_score + score)

			if (step + 1 >= depth) continue
			if (path_ids.has(edge.target_id)) continue

			path_ids.add(edge.target_id)

			await this.collectSequenceScores({
				source_id: edge.target_id,
				depth,
				step: step + 1,
				base_score: base_score * edge_weight,
				scores,
				path_ids
			})
			path_ids.delete(edge.target_id)
		}
	}

	private async runShadowTick() {
		await execSql(this.p.db, sql.brain.sql_run_shadow_tick)

		await this.tick(0.8, true, 0.5)
	}

	private isIdle(deep?: boolean) {
		return (
			Date.now() - this.last_user_interaction >
			(deep ? system.timing.idle_decay_threshold_ms : system.timing.idle_timeout_ms)
		)
	}

	off() {
		if (this.shadow_interval) {
			clearInterval(this.shadow_interval)
		}
	}
}
