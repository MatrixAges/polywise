export default class {
	private map = new Map<string, any>()
	private prefix_map = new Map<string, Set<string>>()

	get(prefix: string, key: string) {
		return this.map.get(`${prefix}::${key}`)
	}

	set(prefix: string, key: string, value: any) {
		const full_key = `${prefix}::${key}`
		this.map.set(full_key, value)

		if (!this.prefix_map.has(prefix)) {
			this.prefix_map.set(prefix, new Set())
		}

		this.prefix_map.get(prefix)!.add(key)
	}

	remove(prefix: string, key: string) {
		const full_key = `${prefix}::${key}`

		if (this.map.delete(full_key)) {
			this.prefix_map.get(prefix)?.delete(key)
		}
	}

	getByPrefix(prefix: string) {
		const result = new Map<string, any>()
		const keys = this.prefix_map.get(prefix)

		if (keys) {
			keys.forEach(short_key => {
				result.set(short_key, this.map.get(`${prefix}::${short_key}`))
			})
		}

		return result
	}

	removeByPrefix(prefix: string) {
		const keys = this.prefix_map.get(prefix)
		if (!keys) return

		keys.forEach(short_key => {
			this.map.delete(`${prefix}::${short_key}`)
		})

		this.prefix_map.delete(prefix)
	}
}
