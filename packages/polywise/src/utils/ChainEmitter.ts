import type { COTDepthResult } from '../types'

export default class ChainEmitter {
	private callbacks: Set<(data: COTDepthResult) => void> = new Set()
	private finish_callbacks: Set<(data: { knowledges: string[]; actions: string[]; metadatas: any[] }) => void> =
		new Set()
	private isActive = true
	private is_finished = false
	private last_data: { knowledges: string[]; actions: string[]; metadatas: any[] } | null = null

	on(callback: (data: COTDepthResult) => void): ChainEmitter {
		if (this.isActive) {
			this.callbacks.add(callback)
		}

		return this
	}

	onFinish(callback: (data: { knowledges: string[]; actions: string[]; metadatas: any[] }) => void): ChainEmitter {
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

	finish(data: { knowledges: string[]; actions: string[]; metadatas: any[] }): void {
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
		return new Promise<{ knowledges: string[]; actions: string[]; metadatas: any[] }>(resolve => {
			this.onFinish(resolve)
		})
	}

	isActiveStatus(): boolean {
		return this.isActive
	}
}
