import { config } from '@core/config'
import { addNotification, addNotificationSession, syncTodoSessionStatusBySessionId } from '@core/db/services'
import { env } from '@core/env'
import { pushPart, startStream, stopStream } from '@core/fst/agents/supervisor'
import { createPartDurationTracker, getPartDurationChunk } from '@core/fst/duration'
import { convertToModelMessages, createUIMessageStream, smoothStream, stepCountIs, streamText } from 'ai'
import { getId } from 'stk/utils'

import { emitChange, isAbortError, sanitizeToolSet, wrapToolSetWithAgentLogging } from '../../../utils'
import runHooks from '../../hooks/runHooks'
import buildPrompt from '../prompt/buildPrompt'
import buildTools from '../tools/buildTools'
import acceptInput from './acceptInput'
import finishDefaultRun from './finishDefaultRun'

import type { UIMessageChunk } from 'ai'
import type { Message, MessageDataParts, MessageMetadata, MessagePartDurationUIPart } from '../../../types'
import type { PromptState, ToolState } from '../../core/types'
import type Session from '../../index'

export default async (s: Session, message: Message) => {
	await s.getModel()
	const { isFirst } = await acceptInput(s, message)

	if (config.chaos_detect) startStream(s, message)

	const messages = await convertToModelMessages(s.model_messages)

	if (s.prefill) {
		messages.push({ role: 'assistant', content: s.prefill })
	}

	const toolState = (await buildTools(s, message, isFirst)) as ToolState
	const promptState = (await buildPrompt(s, message, isFirst, toolState)) as PromptState
	const titleFocus = promptState.titleFocus || ''
	const runtime = toolState.runtime as any

	if (!runtime) {
		throw new Error('runtime tools not resolved')
	}

	const system = promptState.system
	const use_native_codex_tools = s.model.runtime_name === 'codex_native'
	const tools = use_native_codex_tools
		? undefined
		: wrapToolSetWithAgentLogging(s, sanitizeToolSet(runtime.tools as any))
	const res = streamText({
		model: s.model.model,
		system,
		messages,
		tools,
		abortSignal: s.abort_controller.signal,
		providerOptions: s.model.provider_options,
		stopWhen: stepCountIs(300),
		experimental_transform: smoothStream(),
		onAbort: s.stop.bind(s),
		onError: async ({ error }) => {
			const manual = s.manual_abort || isAbortError(error)
			await runHooks(s, 'onError', { error, manual })

			if (config.chaos_detect) stopStream(s.id)

			await s.stop()

			if (manual) {
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
				const error_message = error instanceof Error ? error.message : String(error)

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

	await s.setRunning(true)
	await runHooks(s, 'onStart', { message, mode: 'default' })
	s.sync()

	const durationParts = [] as Array<MessagePartDurationUIPart>

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
				await runHooks(s, 'onChunk', { chunk })

				const durationChunk = getPartDurationChunk(chunk, tracker)

				if (durationChunk) {
					durationParts.push(durationChunk)
					writer.write(durationChunk)
				}
			}
		},
		onFinish: async ({ responseMessage }) => {
			const wasRunning = s.session.is_runing
			if (config.chaos_detect) stopStream(s.id)
			await finishDefaultRun({
				s,
				message,
				responseMessage,
				durationParts,
				titleFocus,
				wasRunning
			})
		},
		onError: error => {
			void runHooks(s, 'onError', {
				error,
				manual: s.manual_abort || isAbortError(error)
			})

			if (s.manual_abort || isAbortError(error)) {
				s.manual_abort = false

				return ''
			}

			return `Stream error: ${error instanceof Error ? error.message : String(error)}`
		}
	})
}
