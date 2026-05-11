import { config } from '@core/config'
import fst_report_tool_prompt from '@core/consts/prompts/fst_report_tool_prompt.md'
import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import plan_mode_prompt from '@core/consts/prompts/plan_mode_prompt.md'
import planexec_exec_prompt from '@core/consts/prompts/planexec_exec_prompt.md'
import planexec_plan_prompt from '@core/consts/prompts/planexec_plan_prompt.md'
import { addNotification, addNotificationSession, syncTodoSessionStatusBySessionId } from '@core/db/services'
import { env } from '@core/env'
import { createSystemTool } from '@core/fst/agents'
import { extract, getComplexitySignal } from '@core/fst/agents/superego'
import { pushPart, startStream, stopStream } from '@core/fst/agents/supervisor'
import { createPartDurationTracker, getPartDurationChunk } from '@core/fst/duration'
import { getSystemTools, SessionEventStore } from '@core/utils'
import { convertToModelMessages, createUIMessageStream, smoothStream, stepCountIs, streamText } from 'ai'
import dayjs from 'dayjs'
import { getId } from 'stk/utils'
import { match } from 'ts-pattern'

import { loadMcpTools } from '../../mcp'
import {
	createBashTool,
	createContentTool,
	createContextTool,
	createCronTool,
	createCustomToolSet,
	createEditFileTool,
	createErrorCollectTool,
	createGlobTool,
	createMessageTool,
	createMetaTool,
	createPlanTool,
	createQuestionTool,
	createReportTool,
	createSearchFileTool,
	createSkillTool,
	createTitleTool,
	createWebFetchTool,
	createWebSearchTool,
	getCustomToolsPrompt,
	getSkillPrompt,
	updateTitle
} from '../../tools'
import {
	emitChange,
	getAgentSystemPrompt,
	getTitleFocus,
	isAbortError,
	sanitizeToolSet,
	submit,
	wrapToolSetWithAgentLogging
} from '../../utils'

import type { ToolSet, UIMessageChunk } from 'ai'
import type { Message, MessageDataParts, MessageMetadata } from '../../types'
import type Index from '../index'

const model_threshold_value = 12

export default async (s: Index, message: Message) => {
	await s.getModel()

	const total_messages_count = s.context.total_messages_count ?? 0
	const is_first_message = total_messages_count === 0

	if (!s.session.is_runing) {
		s.context.total_messages_count = total_messages_count + 1

		await s.insertMessage(message)

		s.model_messages.push(message)
		s.ui_messages.push(message)
	}

	s.context.current_messages_count = s.model_messages.length

	if (config.chaos_detect) startStream(s, message)

	s.manual_abort = false
	s.runing(true)
	s.sync()

	const messages = await convertToModelMessages(s.model_messages)

	if (s.prefill) messages.push({ role: 'assistant', content: s.prefill })

	const bash_tool = await createBashTool(s)
	const mcp_tools = await loadMcpTools(s)
	const system_tools_prompt = await getSystemTools()
	const has_todo_session_link = await s.has_todo_session_link
	const agent_system_prompt = await getAgentSystemPrompt(s.id)

	const custom_tools_prompt = getCustomToolsPrompt(s.custom_tools_map)
	const skill_prompt = getSkillPrompt(s.skill_map)
	const title_focus = getTitleFocus({ s, message, is_first_message })
	const custom_tools = await createCustomToolSet(s)

	const mode_prompt = match({ mode: s.mode, plan_stage: s.plan_stage })
		.with({ mode: 'plan' }, () => plan_mode_prompt)
		.with({ mode: 'plan-exec', plan_stage: 'plan' }, () => planexec_plan_prompt)
		.with({ mode: 'plan-exec', plan_stage: 'exec' }, () => planexec_exec_prompt)
		.otherwise(() => '')

	const system_prompt = [
		fst_system_prompt,
		agent_system_prompt,
		has_todo_session_link ? fst_report_tool_prompt : '',
		system_tools_prompt,
		custom_tools_prompt,
		skill_prompt,
		`Current Session Title: ${s.session.title}`,
		has_todo_session_link ? `Current Session Report: ${s.session.report ?? ''}` : '',
		getContextPrompt(s.context),
		mode_prompt,
		`Real World Date: ${dayjs().format('YYYY-MM-DD')}`
	]
		.filter(Boolean)
		.join('\n\n')

	const tools = wrapToolSetWithAgentLogging(
		s,
		sanitizeToolSet({
			...custom_tools,
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
			content_tool: createContentTool(s),
			web_search_tool: createWebSearchTool(),
			web_fetch_tool: createWebFetchTool(),
			cron_tool: createCronTool(s),
			error_collect_tool: createErrorCollectTool(),
			meta_tool: createMetaTool(s)
		} as ToolSet)
	)

	if (has_todo_session_link) {
		tools.report_tool = createReportTool(s)
	}

	const res = streamText({
		model: s.model.model,
		system: system_prompt,
		messages,
		tools,
		abortSignal: s.abort_controller.signal,
		providerOptions: s.model.provider_options,
		stopWhen: stepCountIs(300),
		experimental_transform: smoothStream(),
		onAbort: s.stop.bind(s),
		onError: async (event: { error: unknown }) => {
			const is_manual_abort = s.manual_abort || isAbortError(event.error)

			if (config.chaos_detect) stopStream(s.id)

			await s.stop()

			if (is_manual_abort) {
				s.manual_abort = false
				await emitChange({
					session: s.session,
					running_since: s.running_since,
					running_done: s.session.running_done ?? null
				})

				return
			}

			await syncTodoSessionStatusBySessionId({
				session_id: s.id,
				from_status_list: ['processing'],
				to_status: 'error'
			})

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

			s.manual_abort = false
			await emitChange({
				session: s.session,
				running_since: s.running_since,
				running_done: s.session.running_done ?? null
			})
		}
	})

	return createUIMessageStream({
		originalMessages: [message],
		generateId: getId,
		execute: async ({ writer }) => {
			const tracker = createPartDurationTracker()
			const stream = res.toUIMessageStream({
				originalMessages: [message],
				sendSources: true,
				generateMessageId: getId,
				messageMetadata: ({ part }) => {
					if (part.type !== 'finish') return

					return {
						usage: part.totalUsage,
						timestamp: Date.now()
					} satisfies MessageMetadata
				}
			})
			const reader = stream.getReader()

			while (true) {
				const { done, value } = await reader.read()

				if (done) break

				s.active()

				const chunk = value as UIMessageChunk<MessageMetadata, MessageDataParts>

				if (chunk.type === 'text-delta' && config.chaos_detect) {
					pushPart(s.id, chunk.delta)
				}

				writer.write(chunk)

				const duration_chunk = getPartDurationChunk(chunk, tracker)

				if (duration_chunk) {
					writer.write(duration_chunk)
				}
			}

			if (title_focus) {
				void updateTitle(s, title_focus).catch(() => {})
			}
		},
		onFinish: async ({ responseMessage }) => {
			const was_running = s.session.is_runing

			if (config.chaos_detect) stopStream(s.id)

			await syncTodoSessionStatusBySessionId({
				session_id: s.id,
				from_status_list: ['processing'],
				to_status: 'unreview'
			})
			await s.stop()

			await s.appendMessage(responseMessage)

			s.manual_abort = false

			if (!SessionEventStore.listenerCount(`${s.id}/change`)) {
				const session = await s.updateSession({ unread: true })
				await emitChange({
					session,
					running_since: s.running_since,
					running_done: session.running_done ?? null
				})
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

			if (was_running && s.mode === 'plan-exec' && s.plan_stage === 'plan') {
				s.plan_stage = 'exec'

				setTimeout(() => {
					submit({ id: s.id }, 'Execute the plan.')
				}, 1200)
			}
		},
		onError: error => {
			if (s.manual_abort || isAbortError(error)) {
				s.manual_abort = false

				return ''
			}

			return `Stream error: ${error instanceof Error ? error.message : String(error)}`
		}
	})
}
