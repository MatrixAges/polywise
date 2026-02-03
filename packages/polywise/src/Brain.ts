import { injectable } from 'tsyringe'

import { calculateFatigue, isIdle } from './utils'
import { SHADOW_INTERVAL_MS, FATIGUE_THRESHOLD, IDLE_TIMEOUT_MS } from './consts'

import type Polywise from './Polywise'
import type { BrainState } from './types'
import type { BrainArgs } from './types/args'

@injectable()
export default class Brain {
	private poly: Polywise | null = null
	private state: BrainState = 'FRESH'
	private shadow_interval?: any
	private last_user_interaction = Date.now()
	private current_fatigue = 0

	private on_tick?: () => void

	private is_busy = false

	init(args: BrainArgs) {
		const { poly, onTick } = args

		this.poly = poly
		this.on_tick = onTick

		this.startLifeCycleLoop()
	}

	setBusy(busy: boolean) {
		this.is_busy = busy
	}

	reportUserActivity() {
		this.last_user_interaction = Date.now()
	}

	addSynapticLoad(load: number) {
		this.current_fatigue += load

		if (calculateFatigue(load, this.current_fatigue - load, FATIGUE_THRESHOLD) && this.state === 'FRESH') {
			this.state = 'TIRED'
		}
	}

	async triggerInputBurst(load = 50) {
		if (!this.poly) return

		const prev_state = this.state

		this.state = 'LEARNING'

		this.reportUserActivity()

		this.addSynapticLoad(load)

		for (let i = 0; i < 100; i++) {
			await this.poly.tick(0.3)

			this.on_tick?.()

			await new Promise(resolve => setTimeout(resolve, 50))
		}

		this.state = prev_state === 'SLEEPING' ? 'FRESH' : prev_state

		if (this.current_fatigue >= FATIGUE_THRESHOLD) {
			this.state = 'TIRED'
		}
	}

	async triggerSleepTick() {
		if (!this.poly) return

		this.state = 'SLEEPING'

		await this.poly.triggerSleepTick()

		this.current_fatigue = 0

		this.state = 'FRESH'
	}

	private startLifeCycleLoop() {
		this.shadow_interval = setInterval(async () => {
			if (this.is_busy) return

			const is_idle = isIdle(this.last_user_interaction, IDLE_TIMEOUT_MS)

			if (this.state === 'TIRED' && is_idle) {
				await this.triggerSleepTick()

				return
			}

			if (this.state !== 'SLEEPING' && this.state !== 'LEARNING') {
				await this.runShadowTick()
			}
		}, SHADOW_INTERVAL_MS)
	}

	private async runShadowTick() {
		if (!this.poly) return

		await this.poly.runShadowTick()

		this.on_tick?.()
	}

	off() {
		if (this.shadow_interval) {
			clearInterval(this.shadow_interval)
		}

		this.poly = null
	}
}
