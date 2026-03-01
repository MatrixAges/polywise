import { setTimeout as waitTimeout } from 'timers/promises'
import { injectable } from 'tsyringe'

import { system } from '../consts'
import sql from '../sql'
import { execSql, getMaxReplayScore, getReplayScores, querySql } from '../utils'

import type { BrainState, Node, SleepReplayPayload, SpreadOptions, TickOptions } from '../types'
import type Polywise from './polywise'

@injectable()
export default class Index {
	private p!: Polywise

	private state: BrainState = 'FRESH'
	private last_user_interaction = Date.now()
	private current_fatigue = 0

	private is_loop_running = false
	private is_busy = false
	private timer: NodeJS.Timeout | undefined

	init(p: Polywise) {
		this.p = p
		this.start()
	}

	setBusy(next_busy: boolean) {
		this.is_busy = next_busy
	}

	report() {
		this.last_user_interaction = Date.now()
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

			const replay_payload = await this.p.context.getSleepReplayPayload()

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
		const sequence_scores = await this.p.context.getContextSequenceScores()
		if (!sequence_scores.length) return

		const selected_scores = getReplayScores(sequence_scores)
		if (!selected_scores.length) return

		const max_score = getMaxReplayScore(selected_scores)
		if (max_score <= 0) return

		const context_ids: Array<string> = []
		const strengths: Array<number> = []

		for (const selected_item of selected_scores) {
			context_ids.push(selected_item.context_id)
			strengths.push(system.context_sequence_replay_strength * (selected_item.score / max_score))
		}

		await querySql(this.p.db, sql.brain.sql_strengthen_edges_by_context_batch, [context_ids, strengths])
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
