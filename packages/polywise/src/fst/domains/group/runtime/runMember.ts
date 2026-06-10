import { createPartDurationTracker, getPartDurationChunk } from '@core/fst/duration'
import { consumeStream, smoothStream, stepCountIs, streamText } from 'ai'
import { getId } from 'stk/utils'

import runHooks from '../../../session/hooks/runHooks'
import { sanitizeToolSet, wrapToolSetWithAgentLogging } from '../../../utils'
import hasMeaningfulAssistantMessage from '../../../utils/hasMeaningfulAssistantMessage'
import getAgentModel from './getAgentModel'

import type { Agent } from '@core/db'
import type { ModelMessage, UIMessageChunk } from 'ai'
import type Session from '../../../session'
import type { Message, MessageDataParts, MessageMetadata, MessagePartDurationUIPart } from '../../../types'
import type {
	GroupMemberChunkState,
	GroupMemberDoneState,
	GroupMemberErrorState,
	GroupMemberEvaluation,
	GroupMemberPromptState,
	GroupMemberToolState
} from '../types'

export default async (args: {
	s: Session
	agent: Agent
	evaluation: GroupMemberEvaluation
	messages: Array<ModelMessage>
	original_message: Message
	turn_id: string
}) => {
	const { s, agent, evaluation, messages, original_message, turn_id } = args
	const model = await getAgentModel(agent)
	const toolState = (await runHooks(s, 'onMemberTools', {
		agent,
		evaluation,
		messages,
		originalMessage: original_message,
		turnId: turn_id,
		modelTools: model.tools,
		runtime: null
	} satisfies GroupMemberToolState)) as GroupMemberToolState
	const promptState = (await runHooks(s, 'onMemberPrompt', {
		agent,
		evaluation,
		messages,
		originalMessage: original_message,
		turnId: turn_id,
		tools: toolState,
		system: '',
		stopWhen: []
	} satisfies GroupMemberPromptState)) as GroupMemberPromptState
	const runtime = toolState.runtime as any

	if (!runtime) {
		throw new Error('group member tools not resolved')
	}

	const tools = wrapToolSetWithAgentLogging(s, sanitizeToolSet(runtime.tools))
	const tracker = createPartDurationTracker()
	const res = streamText({
		model: model.model,
		system: promptState.system,
		messages,
		tools,
		abortSignal: s.abort_controller.signal,
		providerOptions: model.provider_options,
		stopWhen: promptState.stopWhen.length ? promptState.stopWhen : [stepCountIs(180)],
		experimental_transform: smoothStream()
	})
	const durationParts = [] as Array<MessagePartDurationUIPart>

	const stream = res
		.toUIMessageStream({
			originalMessages: [original_message],
			sendSources: true,
			generateMessageId: getId,
			messageMetadata: ({ part }) => {
				return {
					...(part.type === 'finish' ? { usage: part.totalUsage } : {}),
					timestamp: Date.now(),
					sender: agent.name,
					sender_id: agent.id,
					sender_role: agent.role,
					group_id: s.group_id,
					group_name: s.group!.name,
					group_turn_id: turn_id,
					leadership: evaluation.leadership
				} satisfies MessageMetadata
			},
			onFinish: async ({ responseMessage }) => {
				responseMessage.metadata = {
					...(responseMessage.metadata ?? {}),
					timestamp: Date.now(),
					sender: agent.name,
					sender_id: agent.id,
					sender_role: agent.role,
					group_id: s.group_id,
					group_name: s.group!.name,
					group_turn_id: turn_id,
					leadership: evaluation.leadership
				} satisfies MessageMetadata

				if (hasMeaningfulAssistantMessage(responseMessage)) {
					await s.appendMessage(responseMessage)
					s.sync()
				}

				await runHooks(s, 'onMemberDone', {
					agent,
					evaluation,
					turnId: turn_id,
					responseMessage,
					durationParts
				} satisfies GroupMemberDoneState)
			},
			onError: error => {
				void runHooks(s, 'onMemberError', {
					agent,
					evaluation,
					turnId: turn_id,
					error,
					manual: s.manual_abort
				} satisfies GroupMemberErrorState)

				if (s.manual_abort) return ''

				return `Stream error: ${error instanceof Error ? error.message : String(error)}`
			}
		})
		.pipeThrough(
			new TransformStream<
				UIMessageChunk<MessageMetadata, MessageDataParts>,
				UIMessageChunk<MessageMetadata, MessageDataParts>
			>({
				transform(chunk, controller) {
					controller.enqueue(chunk)
					void runHooks(s, 'onMemberChunk', {
						agent,
						evaluation,
						turnId: turn_id,
						chunk
					} satisfies GroupMemberChunkState)

					const durationChunk = getPartDurationChunk(chunk, tracker)

					if (durationChunk) {
						durationParts.push(durationChunk)
						controller.enqueue(durationChunk)
					}
				}
			})
		)

	const [mergeStream, waitStream] = stream.tee()

	return {
		stream: mergeStream,
		done: consumeStream({
			stream: waitStream
		})
	}
}
