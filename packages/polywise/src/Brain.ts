import Polywise from './Polywise'
import { calculateFatigue, isIdle } from './utils'

import type { BrainState } from './types'

export class Brain {
	private poly: Polywise
	private state: BrainState = 'FRESH'
	private shadow_interval?: any
	private last_user_interaction = Date.now()
	private current_fatigue = 0
	private on_tick?: () => void

	private readonly SHADOW_INTERVAL_MS = 60 * 1000
	private readonly FATIGUE_THRESHOLD = 1000
	private readonly IDLE_TIMEOUT_MS = 5 * 60 * 1000

	constructor(poly: Polywise, onTick?: () => void) {
		this.poly = poly
		this.on_tick = onTick
		this.startLifeCycleLoop()
	}

	reportUserActivity() {
		this.last_user_interaction = Date.now()
	}

	addSynapticLoad(load: number) {
		this.current_fatigue += load
		if (calculateFatigue(load, this.current_fatigue - load, this.FATIGUE_THRESHOLD) && this.state === 'FRESH') {
			this.state = 'TIRED'
		}
	}

	private startLifeCycleLoop() {
		this.shadow_interval = setInterval(async () => {
			const is_idle = isIdle(this.last_user_interaction, this.IDLE_TIMEOUT_MS)

			if (this.state === 'TIRED' && is_idle) {
				await this.triggerSleepTick()
			} else if (this.state !== 'SLEEPING' && this.state !== 'LEARNING') {
				await this.runShadowTick()
			}
		}, this.SHADOW_INTERVAL_MS)
	}

	private async runShadowTick() {
		await this.poly.runShadowTick()
		this.on_tick?.()
	}

	async triggerInputBurst(load = 50) {
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
		if (this.current_fatigue >= this.FATIGUE_THRESHOLD) {
			this.state = 'TIRED'
		}
	}

	async triggerSleepTick() {
		this.state = 'SLEEPING'
		await this.poly.triggerSleepTick()
		this.current_fatigue = 0
		this.state = 'FRESH'
	}

	stop() {
		if (this.shadow_interval) {
			clearInterval(this.shadow_interval)
		}
	}
}
