import { Polywise } from './Polywise'

export class Brain {
	private poly: Polywise
	private state: 'FRESH' | 'LEARNING' | 'TIRED' | 'SLEEPING' = 'FRESH'
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
		if (this.current_fatigue >= this.FATIGUE_THRESHOLD && this.state === 'FRESH') {
			this.state = 'TIRED'
		}
	}

	private startLifeCycleLoop() {
		this.shadow_interval = setInterval(async () => {
			const now = Date.now()
			const is_idle = now - this.last_user_interaction > this.IDLE_TIMEOUT_MS

			if (this.state === 'TIRED' && is_idle) {
				await this.triggerSleepTick()
			} else if (this.state !== 'SLEEPING' && this.state !== 'LEARNING') {
				await this.runShadowTick()
			}
		}, this.SHADOW_INTERVAL_MS)
	}

	private async runShadowTick() {
		await (this.poly as any).db.exec(`
      UPDATE brain.nodes 
      SET potential = potential + 0.1 
      WHERE id IN (SELECT id FROM brain.nodes ORDER BY random() LIMIT (SELECT count(*)/100 + 1 FROM brain.nodes));
    `)
		await this.poly.tick(0.8)
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
		const db = (this.poly as any).db

		await db.exec('BEGIN')

		// 1. Noise Cleaning: Only delete absolute noise (below retrieval threshold of any kind)
		await db.exec(`
      DELETE FROM brain.edges 
      WHERE weight < 0.001; 
    `)

		// 2. Long-Term Depression (LTD): Further decay weak memories to "subconscious" level
		await db.exec(`
      UPDATE brain.edges
      SET weight = GREATEST(weight - 0.01, 0.001)
      WHERE weight < 0.2;
    `)

		// Replay high impact memories (Dreaming)
		await db.exec(`
      UPDATE brain.edges 
      SET weight = LEAST(weight + 0.2, 5.0)
      WHERE id IN (
        SELECT id FROM brain.edges 
        WHERE learning_rate > 1.5 
        ORDER BY random() LIMIT 5
      );
    `)

		await db.exec('UPDATE brain.nodes SET potential = 0, activation = 0;')
		await db.exec('COMMIT')

		this.current_fatigue = 0
		this.state = 'FRESH'
	}

	stop() {
		if (this.shadow_interval) {
			clearInterval(this.shadow_interval)
		}
	}
}
