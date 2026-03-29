import { DONE_VALUE } from '.'

export interface Publisher {
	publish: (channel: string, message: string) => void
	set: (key: string, value: string) => void
	get: (key: string) => string | number | null
	remove: (key: string) => void
	incr: (key: string) => number
}

export interface Subscriber {
	subscribe: (channel: string, callback: (message: string) => void) => void
	unsubscribe: (channel: string) => void
}

export type PubSub = Publisher & Subscriber

export default () => {
	const subscriptions = new Map<string, ((message: string) => void)[]>()
	const data = new Map<string, string | number>()

	const pubsub: PubSub = {
		publish: (channel, message) => {
			const callbacks = subscriptions.get(channel) || []

			for (const callback of callbacks) {
				callback(message)
			}
		},
		subscribe: (channel, callback) => {
			const callbacks = subscriptions.get(channel) || []

			callbacks.push(callback)
			subscriptions.set(channel, callbacks)
		},
		unsubscribe: channel => {
			subscriptions.delete(channel)
		},
		set: (key, value) => {
			data.set(key, value)
		},
		get: key => {
			return data.get(key) || null
		},
		remove: key => {
			data.delete(key)
		},
		incr: key => {
			const prev_value = data.get(key)

			let value = prev_value === DONE_VALUE ? 0 : (prev_value as number) || 0

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
