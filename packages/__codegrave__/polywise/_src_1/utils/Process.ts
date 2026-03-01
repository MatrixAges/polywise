type Callback = (event: { key: string; value: unknown }, total: Record<string, unknown>, query: string) => void

export default class Index {
	private callbacks: Set<Callback> = new Set()
	private query: string
	private total: Record<string, unknown> = {}

	constructor(query: string) {
		this.query = query
	}

	on(callback: Callback) {
		if (!this.query) return

		this.callbacks.add(callback)

		return this
	}

	emit(key: string, value: any) {
		if (!this.query) return

		this.total[key] = value

		const event = { key, value }

		for (const callback of this.callbacks) {
			try {
				callback(event, this.total, this.query)
			} catch (error) {
				console.error('Process callback error:', error)
			}
		}
	}

	off() {
		this.callbacks.clear()
		this.query = ''
		this.total = {}
	}
}
