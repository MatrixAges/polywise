import { message } from '@core/db/schema'
import { env } from '@core/env'
import { convertToModelMessages, tool } from 'ai'
import { and, asc, eq, lt, sql } from 'drizzle-orm'
import { number, object } from 'zod'

import type { Message } from '../types'

const input = object({
	count: number().int().min(1).describe('Number of messages to read'),
	before: number()
		.int()
		.min(0)
		.optional()
		.describe('Skip N messages immediately before your current context window'),
	offset: number()
		.int()
		.min(1)
		.optional()
		.describe('Read from absolute position -N (e.g., offset=50 reads from position -50)')
})

const parseMessage = (item: typeof message.$inferSelect) => {
	const parsed = JSON.parse(item.content)

	parsed.createdAt = item.created_at

	return parsed
}

const buildResponse = (total: number, model_count: number, range: Array<number>, messages: Array<unknown>) => ({
	all_messages_count: {
		desc: 'Total messages in this session',
		data: total
	},
	current_model_messages_count: {
		desc: 'Messages in your current context window',
		data: model_count
	},
	range: {
		desc: range.length
			? `Relative position range: ${range[0]} to ${range[1]} (-1 = latest)`
			: 'No messages available',
		data: range
	},
	messages: {
		desc: messages.length ? `Returned ${messages.length} history messages` : 'No messages found',
		data: messages
	}
})

export const createMessageTool = (session_id: string, model_messages: Array<Message>) => {
	const baseline = model_messages[0]?.createdAt
	const model_count = model_messages.length

	return tool({
		description: 'Read conversation history before your current context window.',
		inputSchema: input,
		execute: async ({ count, before, offset }) => {
			if (!baseline) {
				return buildResponse(0, 0, [], [])
			}

			const [[{ count: total }], history] = await Promise.all([
				env.db
					.select({ count: sql<number>`count(*)` })
					.from(message)
					.where(eq(message.session_id, session_id)),
				env.db
					.select()
					.from(message)
					.where(and(eq(message.session_id, session_id), lt(message.created_at, baseline)))
					.orderBy(asc(message.created_at))
			])

			const available = history.length
			const history_start_pos = -(model_count + available)

			let skip: number

			if (offset !== undefined) {
				const target_pos = -offset

				skip = Math.max(0, target_pos - history_start_pos)
			} else {
				skip = before ?? 0
			}

			if (skip >= available) {
				return buildResponse(total, model_count, [], [])
			}

			const sliced = history.slice(skip, skip + count)
			const start = history_start_pos + skip
			const end = start + sliced.length - 1

			const res = await convertToModelMessages(sliced.map(parseMessage))

			return buildResponse(total, model_count, [start, end], res)
		}
	})
}
