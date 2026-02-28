import type { CotResult } from '../types'

type Callback = (data: CotResult, total?: Array<CotResult>) => void

export default class ChainEmitter {
	private callbacks: Set<Callback> = new Set()
	private finish_callbacks: Set<Callback> = new Set()
	private steps: Array<CotResult> = []
	private last_data?: CotResult
	private finished = false

	on(callback: Callback) {
		this.callbacks.add(callback)

		return this
	}

	onFinish(callback: Callback): ChainEmitter {
		if (this.finished && this.last_data) {
			callback(this.last_data)

			return this
		}

		this.finish_callbacks.add(callback)

		return this
	}

	emit(data: CotResult) {
		this.steps.push(data)

		for (const callback of this.callbacks) {
			try {
				callback(data, this.steps)
			} catch (error) {
				console.error('ChainEmitter callback error:', error)
			}
		}
	}

	finish(data: CotResult) {
		if (this.finished) return

		this.finished = true
		this.last_data = data

		for (const callback of this.finish_callbacks) {
			try {
				callback(data)
			} catch (error) {
				console.error('ChainEmitter finish callback error:', error)
			}
		}

		this.finish_callbacks.clear()
	}

	async asPromise() {
		return new Promise<CotResult>(resolve => this.onFinish(resolve))
	}

	off() {
		this.callbacks.clear()
		this.finish_callbacks.clear()
		this.steps = []
	}
}
