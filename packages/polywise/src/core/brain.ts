import to from 'await-to-js'
import { catchFinally } from 'shared'
import { injectable } from 'tsyringe'

import { system } from '../consts'
import sql from '../sql'
import { execSql } from '../utils'

import type { BrainState } from '../types'
import type Polywise from './polywise'

@injectable()
export default class Index {
	private p!: Polywise

	private state: BrainState = 'FRESH'
	private last_user_interaction = Date.now()
	private current_fatigue = 0
	private is_busy = false
	private shadow_interval?: NodeJS.Timeout

	init(p: Polywise) {
		this.p = p
	}

	busy(v?: boolean) {
		this.is_busy = v ?? true
	}

	report() {
		this.last_user_interaction = Date.now()
	}

	addSynapticLoad(load: number) {
		this.current_fatigue += load

		if (this.current_fatigue > system.activation.fatigue_threshold && this.state === 'FRESH') {
			this.state = 'TIRED'
		}
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

		if (this.current_fatigue >= system.activation.fatigue_threshold) {
			this.state = 'TIRED'
		}
	}

	@catchFinally<Index>(ctx => ctx.busy(false))
	private async triggerSleepTick() {
		this.p.logger.log('SYSTEM', 'triggerSleepTick start')

		this.state = 'SLEEPING'

		const active_res = (await this.p.db.query(sql.brain.sql_get_active_node_count)) as Array<{ count: number }>

		const active_count = active_res[0]?.count ?? 0

		Console.log('SYSTEM', 'triggerSleepTick check', { active_count, limit: MAX_ACTIVE_LIMIT })

		const is_overloaded = active_count > MAX_ACTIVE_LIMIT

		if (!is_overloaded) {
			Console.log('SYSTEM', 'triggerSleepTick skipped - not overloaded')
			return
		}

		Console.log('SYSTEM', 'triggerSleepTick executing - cognitive overload detected')

		const sequence_scores = await this.getContextSequenceScores()
		const filtered_scores = sequence_scores.filter(
			score_item => score_item.score >= CONTEXT_SEQUENCE_REPLAY_MIN_SCORE
		)
		const selected_scores = filtered_scores.slice(0, CONTEXT_SEQUENCE_REPLAY_LIMIT)
		const context_ids = selected_scores.map(score_item => score_item.context_id)
		const context_scores = selected_scores.map(score_item => score_item.score)

		await this.exec(sql_sleep_tick_begin)
		await this.exec(sql_sleep_tick_clean_noise)
		await this.exec(sql_sleep_tick_decay_nodes)
		await this.exec(sql_sleep_tick_decay_edges)

		await this.queryRaw(sql_sleep_tick_replay, [context_ids, context_scores])

		await this.exec(sql_sleep_tick_commit)

		this.current_fatigue = 0
		this.state = 'FRESH'

		Console.log('SYSTEM', 'triggerSleepTick completed')
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
		const threshold = threshold_override ?? DEFAULT_NODE_THRESHOLD

		// Calculate System Heat (Homeostatic Plasticity)
		const active_res = (await this.queryRaw(sql_get_active_node_count)) as Array<{ count: number }>
		const active_count = active_res[0]?.count ?? 0
		const heat = Math.min(1.0, active_count / MAX_ACTIVE_LIMIT)
		const threshold_decrement = MAX_THRESHOLD_DECAY_STEP * (1.0 - heat)
		const inhibition_factor = Math.min(GLOBAL_INHIBITION_MAX, Math.max(0, heat * GLOBAL_INHIBITION_MAX))

		await this.exec(sql_propagate(threshold, threshold_decrement, is_learning, arousal, inhibition_factor))

		await this.queryRaw(sql_increment_input_count)

		const count_res = (await this.queryRaw(sql_get_input_count)) as Array<{ value: number }>
		const count = count_res[0]?.value ?? 0

		if (count > INPUT_DECAY_THRESHOLD) {
			await this.exec(sql_decay)
			await this.exec(sql_reset_input_count)
		}
	}

	private startLifeCycleLoop() {
		this.shadow_interval = setInterval(async () => {
			if (this.is_busy) return

			const is_idle = isIdle(this.last_user_interaction, system.timing.idle_timeout_ms)
			const is_deep_idle = isIdle(this.last_user_interaction, system.timing.idle_decay_threshold_ms)

			if (is_deep_idle && this.state !== 'SLEEPING' && this.state !== 'LEARNING') {
				const [err] = await to(this.trigger_memory_reorganization())

				if (err) console.error('Memory reorganization error:', err)

				return
			}

			if (this.state === 'TIRED' && is_idle) {
				const [err] = await to(this.triggerSleepTick())

				if (err) console.error('Brain sleep tick error:', err)

				return
			}

			if (this.state !== 'SLEEPING' && this.state !== 'LEARNING') {
				await this.runShadowTick()
			}
		}, system.timing.shadow_interval_ms)
	}

	private async runShadowTick() {
		await this.exec(sql_run_shadow_tick)

		await this.tick(0.8, true, 0.5)
	}

	off() {
		if (this.shadow_interval) {
			clearInterval(this.shadow_interval)
		}
	}
}
