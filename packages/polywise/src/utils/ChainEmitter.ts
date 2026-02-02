import type { COTDepthResult } from '../types/args'

export default class ChainEmitter {
	private callbacks: Set<(data: COTDepthResult) => void> = new Set()
	private isActive = true

	on(callback: (data: COTDepthResult) => void): ChainEmitter {
		if (this.isActive) {
			this.callbacks.add(callback)
		}
		return this
	}

	off(): void {
		this.isActive = false
		this.callbacks.clear()
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

	isActiveStatus(): boolean {
		return this.isActive
	}
}
