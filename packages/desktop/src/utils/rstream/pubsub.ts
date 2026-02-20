export type PubSub = {
	publish: (channel: string, message: string) => void
	subscribe: (channel: string, callback: (message: string) => void) => void
	unsubscribe: (channel: string) => void
	set: (key: string, value: string | number) => void
	get: (key: string) => string | number | null
	remove: (key: string) => void
	incr: (key: string) => number
}

export const getPubSub = () => {
	const subscriptions = new Map<string, ((message: string) => void)[]>()
	const data = new Map<string, string | number>()

	const pubsub: PubSub = {
		publish: (channel: string, message: string) => {
			const callbacks = subscriptions.get(channel) || []

			for (const callback of callbacks) {
				callback(message)
			}
		},
		subscribe: (channel: string, callback: (message: string) => void) => {
			const callbacks = subscriptions.get(channel) || []

			callbacks.push(callback)
			subscriptions.set(channel, callbacks)
		},
		unsubscribe: (channel: string) => {
			subscriptions.delete(channel)
		},
		set: (key: string, value: string | number) => {
			data.set(key, value)
		},
		get: (key: string) => {
			return data.get(key) || null
		},
		remove: (key: string) => {
			data.delete(key)
		},
		incr: (key: string) => {
			const value = Number(data.get(key) || 0)
			const new_value = value + 1

			data.set(key, new_value)

			return new_value
		}
	}

	return {
		subscriber: pubsub,
		publisher: pubsub
	}
}
