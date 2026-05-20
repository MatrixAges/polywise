import { p, SessionEventStore } from '@core/utils'
import { array, boolean, enum as Enum, object, string } from 'zod'

export const stop = p.input(string()).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input}/stop`)
})

export const destroy = p.input(string()).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input}/destroy`)
})

export const load = p.input(object({ id: string(), type: Enum(['prev', 'next']) })).query(async ({ input }) => {
	SessionEventStore.emit(`${input.id}/load`, input.type)
})

export const clear = p.input(string()).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input}/clear`)
})

export const removeMessage = p.input(object({ id: string(), message_id: string() })).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input.id}/removeMessage`, input.message_id)
})

export const archive = p.input(string()).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input}/archive`)
})

export const unarchive = p.input(string()).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input}/unarchive`)
})

export const answer = p.input(object({ id: string(), answer: string() })).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input.id}/answer`, input.answer)
})

export const permission = p.input(object({ id: string(), approved: boolean() })).mutation(async ({ input }) => {
	SessionEventStore.emit(`${input.id}/permission`, input.approved)
})

export const setConfig = p
	.input(
		object({
			id: string(),
			mode: string().optional(),
			audit_mode: Enum(['limited', 'auto', 'full']).optional(),
			disable_map: array(string()).optional(),
			enable_sub_agent: boolean().optional(),
			enable_agent_tool: boolean().optional(),
			agent_ids: array(string()).optional()
		})
	)
	.mutation(async ({ input }) => {
		SessionEventStore.emit(`${input.id}/setConfig`, {
			...(input.mode ? { mode: input.mode } : {}),
			...(input.audit_mode ? { audit_mode: input.audit_mode } : {}),
			...(input.disable_map ? { disable_map: input.disable_map } : {}),
			...(typeof input.enable_sub_agent === 'boolean' ? { enable_sub_agent: input.enable_sub_agent } : {}),
			...(typeof input.enable_agent_tool === 'boolean'
				? { enable_agent_tool: input.enable_agent_tool }
				: {}),
			...(input.agent_ids ? { agent_ids: input.agent_ids } : {})
		})
	})
