import { message } from '@core/db/schema'
import { env } from '@core/env'
import { convertToModelMessages, tool } from 'ai'
import { and, asc, eq, lt } from 'drizzle-orm'
import { number, object } from 'zod'

import type { Message } from '../types'

export const createMessageTool = (session_id: string, model_messages: Array<Message>) => {
	return tool({
		description:
			'Read conversation history before your current context window. The baseline is the oldest message you can currently see.',
		inputSchema: object({
			count: number().int().min(1).describe('Number of messages to read'),
			before: number()
				.int()
				.min(0)
				.optional()
				.describe(
					'Optional: Additional offset before the baseline. before=0 reads messages immediately before your current context.'
				)
		}),
		execute: async ({ count, before }) => {
			const baseline = model_messages[0]?.createdAt

			if (!baseline) {
				return []
			}

			const offset = before ?? 0
			const limit = count + offset

			const res = await env.db
				.select()
				.from(message)
				.where(and(eq(message.session_id, session_id), lt(message.created_at, baseline)))
				.orderBy(asc(message.created_at))
				.limit(limit)

			if (res.length <= offset) {
				return []
			}

			const target = res.slice(offset)

			const selected = target.map(item => {
				const parsed = JSON.parse(item.content)
				parsed.createdAt = item.created_at
				return parsed
			})

			return convertToModelMessages(selected)
		}
	})
}
