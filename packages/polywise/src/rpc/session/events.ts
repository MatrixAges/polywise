import { p, SessionEventStore } from '@core/utils'
import { enum as Enum, object, string } from 'zod'

export const stop = p.input(string()).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input}/stop`)
})

export const destroy = p.input(string()).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input}/destroy`)
})

export const clear = p.input(string()).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input}/clear`)
})

export const load = p.input(object({ id: string(), type: Enum(['prev', 'next']) })).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input.id}/load`, input.type)
})
