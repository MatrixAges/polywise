import to from 'await-to-js'
import { injectable } from 'tsyringe'

import { FATIGUE_THRESHOLD, IDLE_TIMEOUT_MS, SHADOW_INTERVAL_MS } from './consts'
import { catchFinally } from './decorators'
import Polywise from './Polywise'
import { calculateFatigue, isIdle } from './utils'

import type { BrainState } from './types'

@injectable()
export default class Brain {
	private p!: Polywise

	private state: BrainState = 'FRESH'
	private shadow_interval?: any
	private last_user_interaction = Date.now()
	private current_fatigue = 0
	private is_busy = false

	init(p: Polywise) {
		this.p = p

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

	@catchFinally(function (this: Brain) {
		this.setBusy(false)
	})
	async triggerInputBurst(load = 50) {
		const prev_state = this.state

		this.state = 'LEARNING'

		this.reportUserActivity()
		this.addSynapticLoad(load)

		for (let i = 0; i < 100; i++) {
			await this.p.tick(0.3)

			this.p.onTick?.()

			await new Promise(resolve => setTimeout(resolve, 50))
		}

		this.state = prev_state === 'SLEEPING' ? 'FRESH' : prev_state

		if (this.current_fatigue >= FATIGUE_THRESHOLD) {
			this.state = 'TIRED'
		}
	}

	@catchFinally(function (this: Brain) {
		this.setBusy(false)
	})
	async triggerSleepTick() {
		this.state = 'SLEEPING'

		await this.p.triggerSleepTick()

		this.current_fatigue = 0

		this.state = 'FRESH'
	}

	private startLifeCycleLoop() {
		this.shadow_interval = setInterval(async () => {
			if (this.is_busy) return

			const is_idle = isIdle(this.last_user_interaction, IDLE_TIMEOUT_MS)

			if (this.state === 'TIRED' && is_idle) {
				const [err] = await to(this.triggerSleepTick())

				if (err) console.error('Brain sleep tick error:', err)

				return
			}

			if (this.state !== 'SLEEPING' && this.state !== 'LEARNING') {
				await to(this.runShadowTick())
			}
		}, SHADOW_INTERVAL_MS)
	}

	private async runShadowTick() {
		await this.p.runShadowTick()

		this.p.onTick?.()
	}

	off() {
		if (this.shadow_interval) {
			clearInterval(this.shadow_interval)
		}
	}
}
