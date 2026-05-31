import { p, SessionEventStore } from '@core/utils'
import { array, boolean, enum as Enum, object, string } from 'zod'

export const stop = p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/stop',
			description: 'Run Stop'
		}
	})
	.input(string())
	.mutation(async ({ input }) => {
		SessionEventStore.emit(`${input}/stop`)
	})

export const destroy = p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/destroy',
			description: 'Run Destroy'
		}
	})
	.input(string())
	.mutation(async ({ input }) => {
		SessionEventStore.emit(`${input}/destroy`)
	})

export const load = p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/load',
			description: 'Read Load'
		}
	})
	.input(object({ id: string(), type: Enum(['prev', 'next']) }))
	.query(async ({ input }) => {
		SessionEventStore.emit(`${input.id}/load`, input.type)
	})

export const clear = p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/clear',
			description: 'Run Clear'
		}
	})
	.input(string())
	.mutation(async ({ input }) => {
		SessionEventStore.emit(`${input}/clear`)
	})

export const removeMessage = p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/removeMessage',
			description: 'Run Remove Message'
		}
	})
	.input(object({ id: string(), message_id: string() }))
	.mutation(async ({ input }) => {
		SessionEventStore.emit(`${input.id}/removeMessage`, input.message_id)
	})

export const archive = p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/archive',
			description: 'Run Archive'
		}
	})
	.input(string())
	.mutation(async ({ input }) => {
		SessionEventStore.emit(`${input}/archive`)
	})

export const unarchive = p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/unarchive',
			description: 'Run Unarchive'
		}
	})
	.input(string())
	.mutation(async ({ input }) => {
		SessionEventStore.emit(`${input}/unarchive`)
	})

export const answer = p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/answer',
			description: 'Run Answer'
		}
	})
	.input(object({ id: string(), answer: string() }))
	.mutation(async ({ input }) => {
		SessionEventStore.emit(`${input.id}/answer`, input.answer)
	})

export const permission = p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/permission',
			description: 'Run Permission'
		}
	})
	.input(object({ id: string(), approved: boolean() }))
	.mutation(async ({ input }) => {
		SessionEventStore.emit(`${input.id}/permission`, input.approved)
	})

export const setConfig = p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/setConfig',
			description: 'Run Set Config'
		}
	})
	.input(
		object({
			id: string(),
			mode: string().optional(),
			audit_mode: Enum(['limited', 'auto', 'full']).optional(),
			disable_map: array(string()).optional(),
			enable_sub_agent: boolean().optional(),
			sub_agent_keys: array(string()).optional(),
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
			...(input.sub_agent_keys ? { sub_agent_keys: input.sub_agent_keys } : {}),
			...(typeof input.enable_agent_tool === 'boolean'
				? { enable_agent_tool: input.enable_agent_tool }
				: {}),
			...(input.agent_ids ? { agent_ids: input.agent_ids } : {})
		})
	})
