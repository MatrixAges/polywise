import type { COTDepthResult } from '../types'

export default class ChainEmitter {
	private callbacks: Set<(data: COTDepthResult) => void> = new Set()
	private finish_callbacks: Set<() => void> = new Set()
	private isActive = true
	private is_finished = false

	on(callback: (data: COTDepthResult) => void): ChainEmitter {
		if (this.isActive) {
			this.callbacks.add(callback)
		}

		return this
	}

	onFinish(callback: () => void): ChainEmitter {
		if (this.is_finished) {
			callback()

			return this
		}

		this.finish_callbacks.add(callback)

		return this
	}

	off(): void {
		this.isActive = false
		this.callbacks.clear()
		this.finish_callbacks.clear()
	}

	emit(data: COTDepthResult): void {
		if (this.isActive) {
			for (const callback of this.callbacks) {
				try {
					callback(data)
				} catch (error) {
					console.error('ChainEmitter callback error:', error)
				}
			}
		}
	}

	finish(): void {
		if (!this.isActive || this.is_finished) return

		this.is_finished = true

		for (const callback of this.finish_callbacks) {
			try {
				callback()
			} catch (error) {
				console.error('ChainEmitter finish callback error:', error)
			}
		}

		this.finish_callbacks.clear()
	}

	async toPromise() {
		return new Promise<void>(resolve => {
			this.onFinish(resolve)
		})
	}

	isActiveStatus(): boolean {
		return this.isActive
	}
}
