import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { addNotification, addNotificationSession } from '@core/db/services'
import { env } from '@core/env'
import { createSystemTool } from '@core/fst/agents'
import { processSuperego } from '@core/fst/agents/superego'
import { pushPart, startStream, stopStream } from '@core/fst/agents/supervisor'
import { getSystemTools } from '@core/utils'
import { convertToModelMessages, smoothStream, stepCountIs, streamText } from 'ai'
import { getId } from 'stk/utils'

import {
	createBashTool,
	createContextTool,
	createCronTool,
	createEditFileTool,
	createGlobTool,
	createMemoryTool,
	createMessageTool,
	createQuestionTool,
	createSearchFileTool,
	createSkillTool,
	createSuperegoTool,
	createTitleTool,
	createWebFetchTool,
	createWebSearchTool,
	createWikiTool,
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
	s.context.total_messages_count = await s.getMessagesCount()
	s.context.current_messages_count = s.model_messages.length

	if (!s.session.is_runing) {
		await s.insertMessage(message)

		s.model_messages.push(message)
		s.ui_messages.push(message)
	}

	if (s.model_messages.length >= model_threshold_value) {
		await s.trimMessages()
	}

	if (message.role === 'user' && !s.session.is_cron && s.context.total_messages_count === 0) {
		const focus = getTextParts(message)

		if (focus) {
			await updateTitle(s, focus)
		}
	}

	await s.runing(true)

	startStream(s, message)

	s.sync()

	const messages = await convertToModelMessages(s.model_messages)

	if (s.prefill) messages.push({ role: 'assistant', content: s.prefill })

	const bash_tool = await createBashTool(s)
	const system_tools_prompt = await getSystemTools()

	const res = streamText({
		model: s.model.model,
		system: `${fst_system_prompt}\n\n${system_tools_prompt}\n\nCurrent Session Title: ${s.session.title}\n\n${getContextPrompt(s.context)}`,
		messages,
		tools: {
			...s.model.tools,
			context_tool: createContextTool(s),
			message_tool: createMessageTool(s.id, s.model_messages),
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
			superego_tool: createSuperegoTool(s),
			web_search_tool: createWebSearchTool(),
			web_fetch_tool: createWebFetchTool(),
			cron_tool: createCronTool(s)
		},
		abortSignal: s.abort_controller.signal,
		providerOptions: s.model.provider_options,
		stopWhen: stepCountIs(300),
		experimental_transform: smoothStream(),
		onAbort: s.stop.bind(s),
		onError: async (event: { error: unknown }) => {
			stopStream(s.id)

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

			await s.stop()
		}
	})

	let reasoning_start = 0
	let reasoning_end = 0

	return res.toUIMessageStream({
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
				const target = { usage: part.totalUsage, timestamp: Date.now() } as MessageMetadata

				if (reasoning_end) {
					target['reasoning_duration'] = reasoning_end - reasoning_start
				}

				reasoning_start = 0
				reasoning_end = 0

				return target
			}
		},
		onFinish: async ({ responseMessage }) => {
			if (responseMessage.parts.length) {
				await s.appendMessage(responseMessage)
				s.superego_append_count++
			}

			if (s.superego_append_count >= 3) {
				s.superego_append_count = 0
				processSuperego(s).catch(() => {})
			}

			stopStream(s.id)
			await s.stop()
		}
	})
}
