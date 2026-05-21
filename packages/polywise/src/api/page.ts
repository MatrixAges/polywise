import { z } from 'zod'

import { page_map } from '../cli/page/registry'
import {
	enqueuePageRuntimeCommand,
	getPageRuntimeStatus,
	syncPageRuntime,
	waitForPageRuntimeAck
} from '../cli/page/runtime'

import type { HonoContext } from '@core/types'

const bridge_input_schema = z.object({
	snapshot: z
		.object({
			route: z.object({
				pathname: z.string(),
				search: z.record(z.string(), z.string()),
				params: z.record(z.string(), z.string())
			}),
			panel: z.object({
				active_tab: z.string().nullable(),
				page_id: z.string().nullable()
			}),
			page_id: z.string().nullable(),
			route_page_id: z.string().nullable(),
			page_title: z.string(),
			page_summary: z.string(),
			visible_sections: z.array(
				z.object({
					id: z.string(),
					title: z.string(),
					kind: z.enum(['heading', 'list', 'form', 'editor', 'chat', 'detail']),
					summary: z.string(),
					text_excerpt: z.string().optional()
				})
			),
			actions: z.array(
				z.object({
					id: z.string(),
					label: z.string(),
					kind: z.enum(['navigate', 'click', 'input'])
				})
			),
			updated_at: z.number().int()
		})
		.nullable(),
	last_ack_seq: z.number().int().min(0)
})

export const get = async (c: HonoContext) => {
	return c.json({
		page_map,
		runtime: getPageRuntimeStatus()
	})
}

export const bridge = async (c: HonoContext) => {
	const body = await c.req.json()
	const input = bridge_input_schema.parse(body)

	return c.json(syncPageRuntime(input))
}

const command_input_schema = z.object({
	type: z.enum(['navigate', 'panel', 'back']),
	target: z.string().optional(),
	params: z.record(z.string(), z.string()).optional()
})

export const command = async (c: HonoContext) => {
	const body = await c.req.json()
	const input = command_input_schema.parse(body)
	const command = enqueuePageRuntimeCommand({
		type: input.type,
		...(input.target ? { target: input.target } : {}),
		...(input.params ? { params: input.params } : {})
	})

	const acked = await waitForPageRuntimeAck(command.seq)

	return c.json({
		queued: true,
		acked,
		command,
		runtime: getPageRuntimeStatus()
	})
}
