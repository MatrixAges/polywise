import path from 'path'
import { message } from '@core/db/schema'
import { getMessages, getMessagesCount } from '@core/db/services'
import { grep } from '@core/utils'
import { convertToModelMessages, tool } from 'ai'
import dayjs from 'dayjs'
import { and, asc, eq, lt } from 'drizzle-orm'
import fs from 'fs-extra'
import { enum as Enum, number, object, optional, string } from 'zod'

import type Session from '../session'
import type { Message } from '../types'

const parseMessage = (item: typeof message.$inferSelect) => {
	const parsed = JSON.parse(item.content)

	parsed.createdAt = item.created_at

	return parsed
}

const inputSchema = object({
	action: Enum(['get_total_count', 'get_context_messages_count', 'get_prev_messages', 'search']).describe(
		'The action to perform. get_total_count: total session messages. get_context_messages_count: messages in current context. get_prev_messages: read history. search: search session jsonl logs.'
	),
	args: optional(
		object({
			count: number()
				.int()
				.min(1)
				.optional()
				.describe('[required for get_prev_messages] Number of messages to read'),
			before: number()
				.int()
				.min(0)
				.optional()
				.describe('[required for get_prev_messages] Skip N messages before current context'),
			offset: number()
				.int()
				.min(1)
				.optional()
				.describe('[required for get_prev_messages] Read from absolute position -N'),
			keywords: string().min(1).optional().describe('[required for search] Keywords used by search action'),
			range: object({
				start_date: string().describe('Start date in YYYY-MM-DD format'),
				end_date: string().describe('End date in YYYY-MM-DD format')
			})
				.optional()
				.describe('[required for search][optional] Date range for search action')
		}).describe('[required for get_prev_messages, search] Action-specific arguments')
	).describe('[required for get_prev_messages, search] Action-specific arguments')
})

const getSearchFiles = (session: Session, range?: { start_date: string; end_date: string }) => {
	const messages_dir = path.resolve(session.session_dir, 'messages')

	if (!range) {
		return [path.resolve(messages_dir, `${dayjs().format('YYYY-MM-DD')}.jsonl`)]
	}

	const { start_date, end_date } = range
	const result = [] as Array<string>
	let current_day = dayjs(start_date)
	const last_day = dayjs(end_date)

	while (current_day.isBefore(last_day) || current_day.isSame(last_day, 'day')) {
		result.push(path.resolve(messages_dir, `${current_day.format('YYYY-MM-DD')}.jsonl`))
		current_day = current_day.add(1, 'day')
	}

	return result
}

export const createMessageTool = (session: Session) => {
	const { id, model_messages } = session
	const baseline = model_messages[0]?.createdAt
	const model_count = model_messages.length

	const getTotalCount = async () => {
		const count = await getMessagesCount(eq(message.session_id, id))

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

		const [total, history] = await Promise.all([
			getMessagesCount(eq(message.session_id, id)),
			getMessages({
				where: and(eq(message.session_id, id), lt(message.created_at, baseline)),
				orderBy: asc(message.created_at)
			})
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

	const searchMessages = async (args?: { keywords?: string; range?: { start_date: string; end_date: string } }) => {
		const keywords = args?.keywords

		if (!keywords) {
			return {
				action: 'search' as const,
				error: 'keywords is required for search action',
				data: []
			}
		}

		const target_files = getSearchFiles(session, args?.range)
		const existing_files = [] as Array<string>

		for (const file_path of target_files) {
			if (await fs.pathExists(file_path)) {
				existing_files.push(file_path)
			}
		}

		if (!existing_files.length) {
			return {
				action: 'search' as const,
				data: []
			}
		}

		const matched_lines = await grep(existing_files, keywords, {
			with_filename: true,
			with_line_number: true
		})

		return {
			action: 'search' as const,
			data: matched_lines
		}
	}

	return tool({
		description:
			'Read conversation history. Use get_total_count to check total messages, get_current_messages_count to check your context window size, get_prev_messages to read history, and search to query session jsonl logs.',
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
				case 'search':
					return searchMessages(input.args)
			}
		}
	})
}
