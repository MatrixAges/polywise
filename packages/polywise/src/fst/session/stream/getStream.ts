import { config } from '@core/config'
import { global_linkcase_session_id } from '@core/consts'
import fst_report_tool_prompt from '@core/consts/prompts/fst_report_tool_prompt.md'
import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import fst_title_tool_prompt from '@core/consts/prompts/fst_title_tool_prompt.md'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import plan_mode_prompt from '@core/consts/prompts/plan_mode_prompt.md'
import planexec_exec_prompt from '@core/consts/prompts/planexec_exec_prompt.md'
import planexec_plan_prompt from '@core/consts/prompts/planexec_plan_prompt.md'
import { addNotification, addNotificationSession, syncTodoSessionStatusBySessionId } from '@core/db/services'
import { env } from '@core/env'
import { extract, getComplexitySignal } from '@core/fst/agents/superego'
import { pushPart, startStream, stopStream } from '@core/fst/agents/supervisor'
import { createPartDurationTracker, getPartDurationChunk } from '@core/fst/duration'
import { SessionEventStore } from '@core/utils'
import { convertToModelMessages, createUIMessageStream, smoothStream, stepCountIs, streamText } from 'ai'
import dayjs from 'dayjs'
import { getId } from 'stk/utils'
import { match } from 'ts-pattern'

import {
	buildSharedRuntimeTools,
	createContextTool,
	createCronTool,
	createErrorCollectTool,
	createLinkcaseTool,
	createMessageTool,
	createPlanTool,
	createQuestionTool,
	createReportTool,
	createSelfMemoryTool,
	createSkillTool,
	createTitleTool,
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

import type { UIMessageChunk } from 'ai'
import type { Message, MessageDataParts, MessageMetadata, MessagePartDurationUIPart } from '../../types'
import type Index from '../index'

const model_threshold_value = 12
const linkcase_session_prompt = [
	'# Linkcase Batch Session',
	'This session is dedicated to scheduled and batch Linkcase fetching.',
	'Use linkcase_tool as the primary tool for queue inspection and batch fetch execution.',
	'Prefer linkcase_tool action "fetch_next" for scheduled runs unless the user explicitly provides target ids.',
	'For AI-guided targeted fetch runs, do not use linkcase_tool action "fetch_ids".',
	'Instead, use linkcase_tool action "fetch_preview" with exactly one provider at a time in this order: agent-browser, opencli, crawl4ai, dokobot, r.jina.ai.',
	'After each preview, inspect content_preview yourself and decide whether it is the actual target page content.',
	'If the preview is blocked, irrelevant, partial in the wrong way, or clearly not the target content, continue to the next provider.',
	'Only when a preview looks correct should you call linkcase_tool action "commit_preview" with the preview_key.',
	'If every provider fails or every preview looks wrong, call linkcase_tool action "mark_failed" with a concise reason.',
	'Do not ask follow-up questions during scheduled runs. Execute the fetch plan and return a compact summary of successes, failures, and remaining issues.'
].join('\n')

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

	const messages = await convertToModelMessages(s.model_messages)

	if (s.prefill) messages.push({ role: 'assistant', content: s.prefill })

	const has_todo_session_link = await s.has_todo_session_link
	const agent_system_prompt = await getAgentSystemPrompt(s.id)
	const is_linkcase_batch_session = s.id === global_linkcase_session_id
	const title_focus = getTitleFocus({ s, message, is_first_message })
	const shared_runtime = await buildSharedRuntimeTools({
		s,
		model_tools: s.model.tools,
		extra_tools: {
			context_tool: createContextTool(s),
			message_tool: createMessageTool(s),
			plan_tool: createPlanTool(s),
			question_tool: createQuestionTool(s.id),
			...(s.owner_agent ? { self_memory_tool: createSelfMemoryTool(s) } : {}),
			title_tool: createTitleTool(s),
			skill_tool: createSkillTool(s),
			cron_tool: createCronTool(s),
			error_collect_tool: createErrorCollectTool(),
			...(is_linkcase_batch_session ? { linkcase_tool: createLinkcaseTool(s) } : {}),
			...(has_todo_session_link ? { report_tool: createReportTool(s) } : {})
		}
	})

	const mode_prompt = match({ mode: s.mode, plan_stage: s.plan_stage })
		.with({ mode: 'plan' }, () => plan_mode_prompt)
		.with({ mode: 'plan-exec', plan_stage: 'plan' }, () => planexec_plan_prompt)
		.with({ mode: 'plan-exec', plan_stage: 'exec' }, () => planexec_exec_prompt)
		.otherwise(() => '')
	const has_title_tool = 'title_tool' in shared_runtime.tools

	const system_prompt = [
		fst_system_prompt,
		has_title_tool ? fst_title_tool_prompt : '',
		agent_system_prompt,
		is_linkcase_batch_session ? linkcase_session_prompt : '',
		has_todo_session_link ? fst_report_tool_prompt : '',
		shared_runtime.system_tools_prompt,
		shared_runtime.custom_tools_prompt,
		shared_runtime.skill_prompt,
		`Current Session Title: ${s.session.title}`,
		has_todo_session_link ? `Current Session Report: ${s.session.report ?? ''}` : '',
		getContextPrompt(s.context),
		mode_prompt,
		`Real World Date: ${dayjs().format('YYYY-MM-DD')}`
	]
		.filter(Boolean)
		.join('\n\n')

	const tools = wrapToolSetWithAgentLogging(s, sanitizeToolSet(shared_runtime.tools))
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
	await s.runing(true)
	s.sync()
	const duration_parts = [] as Array<MessagePartDurationUIPart>

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
					duration_parts.push(duration_chunk)
					writer.write(duration_chunk)
				}
			}

			if (title_focus) {
				void updateTitle(s, title_focus).catch(() => {})
			}
		},
		onFinish: async ({ responseMessage }) => {
			const was_running = s.session.is_runing
			const timestamp = Date.now()

			if (duration_parts.length > 0) {
				responseMessage.parts = [...responseMessage.parts, ...duration_parts]
			}

			responseMessage.metadata = {
				...(responseMessage.metadata ?? {}),
				timestamp
			} as MessageMetadata

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
