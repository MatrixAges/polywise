import { p, SessionEventStore } from '@core/utils'
import { string } from 'zod'

export const stop = p.input(string()).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input}/stop`)
})

export const destroy = p.input(string()).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input}/destroy`)
})
