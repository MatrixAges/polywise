import { message } from '@core/db/schema'
import { env } from '@core/env'
import { convertToModelMessages, tool } from 'ai'
import { and, asc, eq, lt, sql } from 'drizzle-orm'
import { discriminatedUnion, literal, number, object, optional } from 'zod'

import type { Message } from '../types'

const parseMessage = (item: typeof message.$inferSelect) => {
	const parsed = JSON.parse(item.content)

	parsed.createdAt = item.created_at

	return parsed
}

const inputSchema = discriminatedUnion('action', [
	object({
		action: literal('get_total_count').describe('Get total message count in this session')
	}),
	object({
		action: literal('get_context_messages_count').describe('Get message count in your current context window')
	}),
	object({
		action: literal('get_prev_messages').describe(
			'Read conversation history before your current context window'
		),
		args: optional(
			object({
				count: number().int().min(1).describe('Number of messages to read'),
				before: number().int().min(0).describe('Skip N messages before current context'),
				offset: number().int().min(1).describe('Read from absolute position -N')
			}).describe('Parameters for get_prev_messages action')
		).describe('Action-specific arguments')
	})
])

export const createMessageTool = (session_id: string, model_messages: Array<Message>) => {
	const baseline = model_messages[0]?.createdAt
	const model_count = model_messages.length

	const getTotalCount = async () => {
		const [{ count }] = await env.db
			.select({ count: sql<number>`count(*)` })
			.from(message)
			.where(eq(message.session_id, session_id))

		return {
			action: 'get_total_count' as const,
			data: { desc: 'Total messages in this session', data: Number(count) }
		}
	}

	const getContextMessagesCount = () => ({
		action: 'get_current_messages_count' as const,
		data: { desc: 'Messages in your current context window', data: model_count }
	})

	const getPrevMessages = async (args?: { count?: number; before?: number; offset?: number }) => {
		if (!baseline) {
			return {
				action: 'get_prev_messages' as const,
				data: {
					range: { desc: 'No baseline message found', data: [] },
					messages: { desc: 'No messages available', data: [] }
				}
			}
		}

		const count = args?.count ?? 10
		const before = args?.before ?? 0
		const offset = args?.offset

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
			skip = before
		}

		if (skip >= available) {
			return {
				action: 'get_prev_messages' as const,
				data: {
					range: { desc: 'No messages available', data: [] },
					messages: {
						desc: `No messages found. Total: ${total}, available before context: ${available}`,
						data: []
					}
				}
			}
		}

		const sliced = history.slice(skip, skip + count)
		const start = history_start_pos + skip
		const end = start + sliced.length - 1

		return {
			action: 'get_prev_messages' as const,
			data: {
				range: {
					desc: `Relative position range: ${start} to ${end} (-1 = latest)`,
					data: [start, end]
				},
				messages: {
					desc: `Returned ${sliced.length} history messages`,
					data: await convertToModelMessages(sliced.map(parseMessage))
				}
			}
		}
	}

	return tool({
		description:
			'Read conversation history. Use get_total_count to check total messages, get_current_messages_count to check your context window size, get_prev_messages to read history.',
		inputSchema,
		execute: async input => {
			const { action } = input

			switch (action) {
				case 'get_total_count':
					return getTotalCount()
				case 'get_context_messages_count':
					return getContextMessagesCount()
				case 'get_prev_messages':
					return getPrevMessages(input.args)
			}
		}
	})
}
