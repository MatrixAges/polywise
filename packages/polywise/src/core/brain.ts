import { setTimeout as waitTimeout } from 'timers/promises'
import { injectable } from 'tsyringe'

import { system } from '../consts'
import sql from '../sql'
import { execSql, getContextEdgeWeight, querySql } from '../utils'

import type {
	BrainState,
	Edge,
	Node,
	SequenceFrontierItem,
	SequenceScore,
	SleepReplayPayload,
	SpreadOptions,
	TickOptions
} from '../types'
import type Polywise from './polywise'

function sortScoreEntryDesc(left_item: [string, number], right_item: [string, number]) {
	return right_item[1] - left_item[1]
}

@injectable()
export default class Index {
	private p!: Polywise

	private state: BrainState = 'FRESH'
	private last_user_interaction = Date.now()
	private last_context_id: string | null = null
	private current_fatigue = 0

	private is_loop_running = false
	private is_busy = false
	private timer: NodeJS.Timeout | undefined

	init(p: Polywise) {
		this.p = p
		this.start()
	}

	async stimulate(node_ids: Array<string>, intensity: number) {
		if (!node_ids.length) return
		if (intensity <= 0) return

		await querySql(this.p.db, sql.stimulate.sql_stimulate_nodes_batch, [intensity, node_ids])
	}

	async strengthen(args: { matched_nodes: Array<Node>; related_nodes: Array<Node> }) {
		const node_ids: Array<string> = []

		for (const matched_node of args.matched_nodes) {
			node_ids.push(matched_node.id)
		}

		for (const related_node of args.related_nodes) {
			node_ids.push(related_node.id)
		}

		const unique_node_ids = Array.from(new Set(node_ids))

		if (unique_node_ids.length < 2) return

		await querySql(this.p.db, sql.stimulate.sql_strengthen_edges_batch, [
			system.strengthen_edge_weight,
			unique_node_ids,
			unique_node_ids
		])
	}

	async spread(options?: SpreadOptions) {
		const steps = options?.steps ?? 3
		const threshold = options?.threshold ?? system.default_node_threshold
		const is_learning = options?.is_learning ?? false
		const arousal = options?.arousal ?? 1.0

		for (let step_index = 0; step_index < steps; step_index++) {
			await this.tick({ threshold, is_learning, arousal })
		}
	}

	async triggerInputBurst(load = 50) {
		if (this.is_busy) return

		this.setBusy(true)
		const prev_state = this.state

		this.state = 'LEARNING'
		this.report()
		this.addSynapticLoad(load)

		try {
			for (let tick_index = 0; tick_index < system.burst_tick_count; tick_index++) {
				await this.tick({ threshold: 0.3, is_learning: true, arousal: 1.0 })
				await waitTimeout(system.burst_tick_delay_ms)
			}
		} finally {
			this.state = prev_state === 'SLEEPING' ? 'FRESH' : prev_state

			this.updateStateByFatigue()
			this.setBusy(false)
		}
	}

	async triggerSleepTick() {
		if (this.is_busy) return

		this.setBusy(true)

		const prev_state = this.state

		this.state = 'SLEEPING'

		try {
			const active_count = await this.getActiveCount()

			const need_sleep_tick = active_count > system.max_active_limit

			if (!need_sleep_tick) {
				this.state = this.getRecoveredState(prev_state)

				return
			}

			const replay_payload = await this.getSleepReplayPayload()

			await this.runSleepTickTransaction(replay_payload)

			this.current_fatigue = 0
			this.state = 'FRESH'
		} catch (error) {
			this.state = this.getRecoveredState(prev_state)

			throw error
		} finally {
			this.setBusy(false)
		}
	}

	private start() {
		if (this.timer) {
			clearTimeout(this.timer)

			this.timer = undefined
		}

		this.timer = setTimeout(() => this.heartbeat(), system.shadow_interval_ms)
	}

	private setBusy(next_busy: boolean) {
		this.is_busy = next_busy
	}

	private report(context_id?: string) {
		this.last_user_interaction = Date.now()
		if (!context_id) return
		this.last_context_id = context_id
	}

	private updateStateByFatigue() {
		if (this.current_fatigue <= system.fatigue_threshold) return
		if (this.state !== 'FRESH') return
		this.state = 'TIRED'
	}

	private addSynapticLoad(load: number) {
		this.current_fatigue += load
		this.updateStateByFatigue()
	}

	private getRecoveredState(prev_state: BrainState) {
		return prev_state === 'LEARNING' ? 'FRESH' : prev_state
	}

	private async getActiveCount() {
		const active_res = await querySql<{ count: number }>(this.p.db, sql.brain.sql_get_active_node_count)
		return active_res[0]?.count ?? 0
	}

	private async tick(options?: TickOptions) {
		const threshold = options?.threshold ?? system.default_node_threshold
		const is_learning = options?.is_learning ?? false
		const arousal = options?.arousal ?? 1.0

		const active_count = await this.getActiveCount()
		const heat = Math.min(1.0, active_count / system.max_active_limit)
		const threshold_decrement = system.max_threshold_decay_step * (1.0 - heat)

		const inhibition_factor = Math.min(
			system.global_inhibition_max,
			Math.max(0, heat * system.global_inhibition_max)
		)

		await execSql(
			this.p.db,
			sql.stimulate.sql_propagate(threshold, threshold_decrement, is_learning, arousal, inhibition_factor)
		)

		await execSql(this.p.db, sql.stat.sql_increment_input_count)

		const count_res = await querySql<{ value: number }>(this.p.db, sql.stat.sql_get_input_count)
		const input_count = count_res[0]?.value ?? 0
		if (input_count <= system.input_decay_threshold) return

		await execSql(this.p.db, sql.stimulate.sql_decay)
		await execSql(this.p.db, sql.stat.sql_reset_input_count)
	}

	private async heartbeat() {
		if (this.is_loop_running) {
			this.start()

			return
		}

		this.is_loop_running = true

		try {
			if (this.is_busy) return

			const deep_idle_handled = await this.tryRunDeepIdleTasks()
			if (deep_idle_handled) return

			const sleep_tick_handled = await this.tryRunSleepTick()
			if (sleep_tick_handled) return

			if (this.isStateBlockedForShadowTick()) return

			await this.runShadowTick()
		} finally {
			this.is_loop_running = false

			this.start()
		}
	}

	private async tryRunDeepIdleTasks() {
		if (!this.canRunDeepIdleTasks()) return false

		await execSql(this.p.db, sql.brain.sql_memory_reorganization)
		await this.applyContextSequenceReplay()
		return true
	}

	private canRunDeepIdleTasks() {
		if (!this.isIdle(true)) return false
		if (this.state === 'SLEEPING') return false
		if (this.state === 'LEARNING') return false
		return true
	}

	private async tryRunSleepTick() {
		if (this.state !== 'TIRED') return false
		if (!this.isIdle(false)) return false

		await this.triggerSleepTick()
		return true
	}

	private isStateBlockedForShadowTick() {
		if (this.state === 'SLEEPING') return true
		if (this.state === 'LEARNING') return true
		return false
	}

	private async getSleepReplayPayload() {
		const sequence_scores = await this.getContextSequenceScores()
		const selected_scores = this.selectReplayScores(sequence_scores)

		const context_ids: Array<string> = []
		const context_scores: Array<number> = []

		for (const selected_item of selected_scores) {
			context_ids.push(selected_item.context_id)
			context_scores.push(selected_item.score)
		}

		const payload: SleepReplayPayload = {
			context_ids,
			context_scores
		}

		return payload
	}

	private async runSleepTickTransaction(replay_payload: SleepReplayPayload) {
		await execSql(this.p.db, sql.meta.sql_begin)

		try {
			await execSql(this.p.db, sql.brain.sql_sleep_tick_clean_noise)
			await execSql(this.p.db, sql.brain.sql_sleep_tick_decay_nodes)
			await execSql(this.p.db, sql.brain.sql_sleep_tick_decay_edges)
			await this.applySleepReplay(replay_payload)
			await execSql(this.p.db, sql.meta.sql_commit)
		} catch (error) {
			await execSql(this.p.db, sql.meta.sql_rollback)
			throw error
		}
	}

	private async applySleepReplay(replay_payload: SleepReplayPayload) {
		if (!replay_payload.context_ids.length) return

		await querySql(this.p.db, sql.brain.sql_sleep_tick_replay, [
			replay_payload.context_ids,
			replay_payload.context_scores
		])
	}

	private async applyContextSequenceReplay() {
		const sequence_scores = await this.getContextSequenceScores()
		if (!sequence_scores.length) return

		const selected_scores = this.selectReplayScores(sequence_scores)
		if (!selected_scores.length) return

		const max_score = this.getMaxReplayScore(selected_scores)
		if (max_score <= 0) return

		const context_ids: Array<string> = []
		const strengths: Array<number> = []

		for (const selected_item of selected_scores) {
			context_ids.push(selected_item.context_id)
			strengths.push(system.context_sequence_replay_strength * (selected_item.score / max_score))
		}

		await querySql(this.p.db, sql.brain.sql_strengthen_edges_by_context_batch, [context_ids, strengths])
	}

	private selectReplayScores(sequence_scores: Array<SequenceScore>) {
		const selected_scores: Array<SequenceScore> = []

		for (const score_item of sequence_scores) {
			if (score_item.score < system.context_sequence_replay_min_score) continue

			selected_scores.push(score_item)
			if (selected_scores.length >= system.context_sequence_replay_limit) break
		}

		return selected_scores
	}

	private getMaxReplayScore(selected_scores: Array<SequenceScore>) {
		let max_score = 0

		for (const selected_item of selected_scores) {
			if (selected_item.score > max_score) {
				max_score = selected_item.score
			}
		}

		return max_score
	}

	private async getContextSequenceScores() {
		if (!this.last_context_id) return [] as Array<SequenceScore>

		const scores = new Map<string, number>()

		let frontier: Array<SequenceFrontierItem> = [
			{
				context_id: this.last_context_id,
				base_score: 1,
				path_ids: new Set<string>([this.last_context_id])
			}
		]

		for (let step_index = 0; step_index < system.context_sequence_depth; step_index++) {
			if (!frontier.length) break

			const source_ids = this.collectFrontierSourceIds(frontier)
			const edges = await this.getContextEdgesBySources(source_ids, system.context_sequence_branch)

			if (!edges.length) break

			const edge_map = this.buildContextEdgeMap(edges)
			const hop_decay = Math.pow(system.context_sequence_hop_decay, step_index)
			const next_frontier: Array<SequenceFrontierItem> = []

			for (const frontier_item of frontier) {
				const source_edges = edge_map.get(frontier_item.context_id)

				if (!source_edges || !source_edges.length) continue

				for (const edge_item of source_edges) {
					if (!edge_item.target_id) continue

					const edge_weight = getContextEdgeWeight(edge_item)

					if (edge_weight <= 0) continue

					const score = frontier_item.base_score * edge_weight * hop_decay
					const prev_score = scores.get(edge_item.target_id) ?? 0

					scores.set(edge_item.target_id, prev_score + score)

					const reach_limit = step_index + 1 >= system.context_sequence_depth

					if (reach_limit) continue
					if (frontier_item.path_ids.has(edge_item.target_id)) continue

					const next_path_ids = new Set<string>(frontier_item.path_ids)

					next_path_ids.add(edge_item.target_id)

					next_frontier.push({
						context_id: edge_item.target_id,
						base_score: frontier_item.base_score * edge_weight,
						path_ids: next_path_ids
					})
				}
			}

			frontier = next_frontier
		}

		const score_entries = Array.from(scores.entries())
		score_entries.sort(sortScoreEntryDesc)

		const sequence_scores: Array<SequenceScore> = []

		for (const entry_item of score_entries) {
			sequence_scores.push({
				context_id: entry_item[0],
				score: entry_item[1]
			})
		}

		return sequence_scores
	}

	private collectFrontierSourceIds(frontier: Array<SequenceFrontierItem>) {
		const source_ids: Array<string> = []

		for (const frontier_item of frontier) {
			source_ids.push(frontier_item.context_id)
		}

		return source_ids
	}

	private buildContextEdgeMap(edges: Array<Edge>) {
		const edge_map = new Map<string, Array<Edge>>()

		for (const edge_item of edges) {
			if (!edge_item.source_id) continue

			const edge_list = edge_map.get(edge_item.source_id) ?? []

			edge_list.push(edge_item)
			edge_map.set(edge_item.source_id, edge_list)
		}

		return edge_map
	}

	private async getContextEdgesBySources(source_ids: Array<string>, branch_limit: number) {
		if (!source_ids.length) return [] as Array<Edge>
		return querySql<Edge>(this.p.db, sql.context.sql_get_context_edges_by_sources, [source_ids, branch_limit])
	}

	private async runShadowTick() {
		await execSql(this.p.db, sql.brain.sql_run_shadow_tick)

		await this.tick({ threshold: 0.8, is_learning: true, arousal: 0.5 })
	}

	private isIdle(deep = false) {
		const idle_ms = Date.now() - this.last_user_interaction
		const threshold_ms = deep ? system.idle_decay_threshold_ms : system.idle_timeout_ms

		return idle_ms > threshold_ms
	}

	off() {
		if (!this.timer) return

		clearTimeout(this.timer)

		this.timer = undefined
	}
}
