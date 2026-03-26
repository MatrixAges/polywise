import { EventEmitter, on } from 'events'

import { p } from '../utils/trpc'

export interface Res {
	status: string
	timestamp: number
	uptime: number
}

const getStatus = () => ({
	status: 'ok',
	timestamp: Date.now(),
	uptime: process.uptime()
})

export default p.subscription(async function* (args) {
	const { signal } = args

	const emitter = new EventEmitter()

	yield getStatus()

	const timer = setInterval(() => {
		emitter.emit('change')
	}, 6000)

	try {
		for await (const _ of on(emitter, 'change', { signal })) {
			yield getStatus() as Res
		}
	} finally {
		clearInterval(timer)

		emitter.removeAllListeners()
	}
})
