import { getShadowContext } from '@core/consts/prompt'
import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import { convertToModelMessages, smoothStream, stepCountIs, streamText } from 'ai'
import { getId } from 'stk/utils'

import {
	createBashTool,
	createContextTool,
	createGlobTool,
	createMessageTool,
	createQuestionTool,
	createWorkingDirTool
} from '../../tools'

import type { Message, MessageMetadata } from '../../types'
import type Index from '../index'

const model_threshold_value = 12

export default async (s: Index, message: Message) => {
	s.context.total_messages_count = await s.getMessagesCount()
	s.context.current_messages_count = s.model_messages.length

	if (!s.session.is_runing) {
		await s.insertMessage(message)

		s.model_messages.push(message)
		s.ui_messages.push(message)
	}

	if (s.model_messages.length >= model_threshold_value) {
		s.trimMessages()
	}

	await s.runing(true)

	s.sync()

	const messages = await convertToModelMessages(s.model_messages)

	if (s.prefill) messages.push({ role: 'assistant', content: s.prefill })

	const bash_tool = await createBashTool(s)

	const res = streamText({
		model: s.model.model,
		system: `${fst_system_prompt}\n\n${getShadowContext(s.context)}`,
		messages,
		tools: {
			...s.model.tools,
			bash_tool: bash_tool.bash,
			read_file_tool: bash_tool.readFile,
			write_file_tool: bash_tool.writeFile,
			glob_tool: createGlobTool(s),
			working_dir_tool: createWorkingDirTool(s),
			message_tool: createMessageTool(s.id, s.model_messages),
			context_tool: createContextTool(s),
			question_tool: createQuestionTool(s.id)
		},
		abortSignal: s.abort_controller.signal,
		providerOptions: s.model.provider_options,
		stopWhen: stepCountIs(300),
		experimental_transform: smoothStream(),
		onAbort: s.stop.bind(s),
		onError: s.stop.bind(s)
	})

	let reasoning_start = 0
	let reasoning_end = 0

	return res.toUIMessageStream({
		originalMessages: [message],
		sendSources: true,
		generateMessageId: getId,
		messageMetadata: ({ part }) => {
			s.active()

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
			await s.appendMessage(responseMessage)
			await s.stop()
		}
	})
}
