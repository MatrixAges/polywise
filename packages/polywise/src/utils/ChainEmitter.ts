import type { COTDepthResult, Metadata } from '../types'

export default class ChainEmitter {
	private callbacks: Set<(data: COTDepthResult, total: Array<COTDepthResult>) => void> = new Set()
	private finish_callbacks: Set<
		(data: { knowledges: Array<string>; actions: Array<string>; metadata: Metadata }) => void
	> = new Set()
	private isActive = true
	private is_finished = false
	private steps: Array<COTDepthResult> = []
	private last_data: { knowledges: Array<string>; actions: Array<string>; metadata: Metadata } | null = null

	on(callback: (data: COTDepthResult, total: Array<COTDepthResult>) => void): ChainEmitter {
		if (this.isActive) {
			this.callbacks.add(callback)
		}

		return this
	}

	onFinish(
		callback: (data: { knowledges: Array<string>; actions: Array<string>; metadata: Metadata }) => void
	): ChainEmitter {
		if (this.is_finished && this.last_data) {
			callback(this.last_data)

			return this
		}

		this.finish_callbacks.add(callback)

		return this
	}

	off(): void {
		this.isActive = false
		this.callbacks.clear()
		this.finish_callbacks.clear()
		this.steps = []
	}

	emit(data: COTDepthResult): void {
		if (this.isActive) {
			this.steps.push(data)

			for (const callback of this.callbacks) {
				try {
					callback(data, this.steps)
				} catch (error) {
					console.error('ChainEmitter callback error:', error)
				}
			}
		}
	}

	finish(data: { knowledges: Array<string>; actions: Array<string>; metadata: Metadata }): void {
		if (!this.isActive || this.is_finished) return

		this.is_finished = true
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

	async toPromise() {
		return new Promise<{ knowledges: Array<string>; actions: Array<string>; metadata: Metadata }>(resolve => {
			this.onFinish(resolve)
		})
	}

	isActiveStatus(): boolean {
		return this.isActive
	}
}
