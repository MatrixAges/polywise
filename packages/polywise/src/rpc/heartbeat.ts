import events from 'events'

import { env } from '../env'
import { p } from '../utils/trpc'

export interface Res {
	status: string
	timestamp: number
	uptime: number
	active: boolean
}

const getStatus = () => ({
	status: 'ok',
	timestamp: Date.now(),
	uptime: process.uptime(),
	active: env.active
})

export default p.subscription(async function* (args) {
	const { signal } = args

	const emitter = new events.EventEmitter()

	yield getStatus()

	const timer = setInterval(() => {
		emitter.emit('change')
	}, 6000)

	try {
		for await (const _ of events.on(emitter, 'change', { signal })) {
			yield getStatus() as Res
		}
	} finally {
		clearInterval(timer)

		emitter.removeAllListeners()
	}
})
