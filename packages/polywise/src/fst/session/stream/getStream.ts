import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { addNotification, addNotificationSession } from '@core/db/services'
import { env } from '@core/env'
import { createSystemTool } from '@core/fst/agents'
import { extract, getComplexitySignal } from '@core/fst/agents/superego'
import { pushPart, startStream, stopStream } from '@core/fst/agents/supervisor'
import { session_status_emitter } from '@core/rpc/session/watchSessionStatus'
import { getSystemTools, SessionEventStore } from '@core/utils'
import { convertToModelMessages, createUIMessageStream, smoothStream, stepCountIs, streamText } from 'ai'
import { getId } from 'stk/utils'

import { loadMcpTools } from '../../mcp'
import {
	createBashTool,
	createContextTool,
	createCronTool,
	createEditFileTool,
	createErrorCollectTool,
	createGlobTool,
	createMemoryTool,
	createMessageTool,
	createMetaTool,
	createPlanTool,
	createQuestionTool,
	createSearchFileTool,
	createSkillTool,
	createTitleTool,
	createWebFetchTool,
	createWebSearchTool,
	createWikiTool,
	getCustomToolsPrompt,
	getSkillPrompt,
	updateTitle
} from '../../tools'

import type { Message, MessageMetadata } from '../../types'
import type Index from '../index'

const model_threshold_value = 12

const getTextParts = (message: Message) => {
	const text_parts = [] as Array<string>

	for (const part of message.parts) {
		if (part.type === 'text' && 'text' in part && typeof part.text === 'string') {
			text_parts.push(part.text)
		}
	}

	return text_parts.join('\n').trim()
}

export default async (s: Index, message: Message) => {
	const total_messages_count = s.context.total_messages_count ?? 0
	const is_first_message = total_messages_count === 0
	const should_insert_message = !s.session.is_runing

	if (should_insert_message) {
		s.context.total_messages_count = total_messages_count + 1

		await s.insertMessage(message)

		s.model_messages.push(message)
		s.ui_messages.push(message)
	}

	s.context.current_messages_count = s.model_messages.length

	s.runing(true)

	startStream(s, message)

	s.sync()

	const messages = await convertToModelMessages(s.model_messages)

	if (s.prefill) messages.push({ role: 'assistant', content: s.prefill })

	const bash_tool = await createBashTool(s)
	const mcp_tools = await loadMcpTools(s)
	const system_tools_prompt = await getSystemTools()
	const custom_tools_prompt = getCustomToolsPrompt(s.custom_tools_map)
	const skill_prompt = getSkillPrompt(s.skill_map)
	const title_focus =
		should_insert_message && message.role === 'user' && !s.session.is_cron && is_first_message
			? getTextParts(message)
			: ''

	const res = streamText({
		model: s.model.model,
		system: `${fst_system_prompt}\n\n${system_tools_prompt}\n\n${custom_tools_prompt}\n\n${skill_prompt}\n\nCurrent Session Title: ${s.session.title}\n\n${getContextPrompt(s.context)}`,
		messages,
		tools: {
			...s.model.tools,
			...mcp_tools,
			context_tool: createContextTool(s),
			message_tool: createMessageTool(s),
			plan_tool: createPlanTool(s),
			question_tool: createQuestionTool(s.id),
			glob_tool: createGlobTool(s),
			search_file_tool: createSearchFileTool(s, bash_tool.env),
			title_tool: createTitleTool(s),
			system_tool: createSystemTool(s),
			bash_tool: bash_tool.bash,
			read_file_tool: bash_tool.readFile,
			write_file_tool: bash_tool.writeFile,
			edit_file_tool: createEditFileTool(s),
			skill_tool: createSkillTool(s),
			memory_tool: createMemoryTool(s),
			wiki_tool: createWikiTool(s),
			web_search_tool: createWebSearchTool(),
			web_fetch_tool: createWebFetchTool(),
			cron_tool: createCronTool(s),
			error_collect_tool: createErrorCollectTool(),
			meta_tool: createMetaTool(s)
		},
		abortSignal: s.abort_controller.signal,
		providerOptions: s.model.provider_options,
		stopWhen: stepCountIs(300),
		experimental_transform: smoothStream(),
		onAbort: s.stop.bind(s),
		onError: async (event: { error: unknown }) => {
			stopStream(s.id)

			await s.stop()

			if (!env.active) {
				const notification_id = getId()
				const error_message = event.error instanceof Error ? event.error.message : String(event.error)

				await addNotification({
					id: notification_id,
					title: 'Stream Error',
					description: error_message,
					is_read: false,
					is_pushed: false
				})

				await addNotificationSession(notification_id, s.id)
			}
		}
	})

	return createUIMessageStream({
		originalMessages: [message],
		generateId: getId,
		execute: async ({ writer }) => {
			let reasoning_start = 0
			let reasoning_end = 0

			writer.merge(
				res.toUIMessageStream({
					originalMessages: [message],
					sendSources: true,
					generateMessageId: getId,
					messageMetadata: ({ part }) => {
						s.active()

						if (part.type === 'text-delta') {
							pushPart(s.id, part.text)
						}

						if (part.type === 'reasoning-start') {
							reasoning_start = Date.now()
						}

						if (part.type === 'reasoning-end') {
							reasoning_end = Date.now()
						}

						if (part.type === 'finish') {
							const target = {
								usage: part.totalUsage,
								timestamp: Date.now()
							} as MessageMetadata

							if (reasoning_end) {
								target['reasoning_duration'] = reasoning_end - reasoning_start + 60
							}

							reasoning_start = 0
							reasoning_end = 0

							return target
						}
					}
				})
			)

			if (title_focus) {
				updateTitle(s, title_focus)
			}
		},
		onFinish: async ({ responseMessage }) => {
			stopStream(s.id)

			await s.stop()
			await s.appendMessage(responseMessage)

			if (!SessionEventStore.listenerCount(`${s.id}/change`)) {
				const next_session = await s.updateSession({ unread: true })

				if (next_session) {
					session_status_emitter.emit('change', {
						[s.id]: {
							title: next_session.title,
							running: next_session.is_runing,
							unread: next_session.unread ?? false
						}
					})
				}
			}

			const complexity_signal = getComplexitySignal({
				response_message: responseMessage,
				recent_message_count: s.model_messages.length
			})

			s.superego_append_count++

			if (s.model_messages.length >= model_threshold_value) {
				await s.trimMessages()
			}

			extract(s, complexity_signal)
		},
		onError: error => {
			s.stop()

			return `Stream error: ${error instanceof Error ? error.message : String(error)}`
		}
	})
}
