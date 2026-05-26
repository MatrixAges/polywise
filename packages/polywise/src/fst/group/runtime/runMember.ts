import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { getGroupRunMemberPrompt } from '@core/consts/prompts/getGroupPrompt'
import { createPartDurationTracker, getPartDurationChunk } from '@core/fst/duration'
import { buildSharedRuntimeTools, createMessageTool } from '@core/fst/tools'
import { consumeStream, smoothStream, stepCountIs, streamText } from 'ai'
import dayjs from 'dayjs'
import { getId } from 'stk/utils'

import { sanitizeToolSet, wrapToolSetWithAgentLogging } from '../../utils'
import { createGroupCoordinationTool } from '../tools/coordination'
import { createGroupMemberTool } from '../tools/member'
import { createGroupProgressTool } from '../tools/progress'
import getAgentModel from './getAgentModel'

import type { Agent } from '@core/db'
import type { ModelMessage, UIMessageChunk } from 'ai'
import type { Message, MessageDataParts, MessageMetadata, MessagePartDurationUIPart } from '../../types'
import type Group from '../index'
import type { GroupMemberEvaluation } from '../types'

const gateWriteTool = <T extends { execute?: (...args: Array<any>) => any }>(
	tool_item: T,
	check: () => Promise<void>,
	append_description = ''
) => {
	const execute = tool_item.execute?.bind(tool_item)
	const description = String((tool_item as { description?: string }).description || '')

	return {
		...tool_item,
		...(append_description ? { description: `${description}\n${append_description}`.trim() } : {}),
		execute: async (...args: Array<any>) => {
			await check()

			return execute?.(...args)
		}
	} as T
}

export default async (args: {
	s: Group
	agent: Agent
	evaluation: GroupMemberEvaluation
	messages: Array<ModelMessage>
	original_message: Message
	turn_id: string
}) => {
	const { s, agent, evaluation, messages, original_message, turn_id } = args
	const model = await getAgentModel(agent)
	const ensureWriteLock = async () => {
		if (s.write_lock.agent_id !== agent.id) {
			throw new Error(
				'Acquire the group write lock with group_coordination_tool before using write-capable tools.'
			)
		}
	}

	const shared_runtime = await buildSharedRuntimeTools({
		s,
		model_tools: model.tools,
		extra_tools: {
			group_progress_tool: createGroupProgressTool(s, agent),
			group_coordination_tool: createGroupCoordinationTool(s, agent),
			group_member_tool: createGroupMemberTool(s, agent),
			message_tool: createMessageTool(s)
		},
		transform_tool: (key, tool_item) => {
			if (key === 'bash_tool' || key === 'write_file_tool' || key === 'edit_file_tool') {
				return gateWriteTool(
					tool_item as { execute?: (...args: Array<any>) => any },
					ensureWriteLock,
					'Requires the group write lock before execution.'
				) as typeof tool_item
			}

			return tool_item
		}
	})

	const tools = wrapToolSetWithAgentLogging(s, sanitizeToolSet(shared_runtime.tools))

	const system_prompt = getGroupRunMemberPrompt({
		agent,
		evaluation,
		group_name: s.group.name,
		group_description: s.group.description,
		has_mounted_folders: s.folders.length > 0,
		cwd: s.cwd,
		additional_mounts: s.additional_mounts,
		has_system_tool: shared_runtime.has_system_tool,
		system_tools_prompt: shared_runtime.system_tools_prompt,
		custom_tools_prompt: shared_runtime.custom_tools_prompt,
		skill_prompt: shared_runtime.skill_prompt,
		context_prompt: getContextPrompt(s.context),
		session_title: s.session.title,
		real_world_date: dayjs().format('YYYY-MM-DD')
	})

	const tracker = createPartDurationTracker()
	const stopAfterTerminalInternalTool = ({
		steps
	}: {
		steps: Array<{ text: string; toolCalls: Array<{ toolName: string }> }>
	}) => {
		const last_step = steps[steps.length - 1]

		if (!last_step) {
			return false
		}

		const has_terminal_internal_tool = last_step.toolCalls.some(
			tool_call =>
				tool_call.toolName === 'group_progress_tool' || tool_call.toolName === 'group_coordination_tool'
		)

		if (!has_terminal_internal_tool) {
			return false
		}

		return steps.some(step => step.text.trim().length > 0)
	}
	const res = streamText({
		model: model.model,
		system: system_prompt,
		messages,
		tools,
		abortSignal: s.abort_controller.signal,
		providerOptions: model.provider_options,
		stopWhen: [stepCountIs(180), stopAfterTerminalInternalTool],
		experimental_transform: smoothStream()
	})
	const duration_parts = [] as Array<MessagePartDurationUIPart>

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
					group_name: s.group.name,
					group_turn_id: turn_id,
					leadership: evaluation.leadership
				} satisfies MessageMetadata
			},
			onFinish: async ({ responseMessage }) => {
				if (duration_parts.length > 0) {
					responseMessage.parts = [...responseMessage.parts, ...duration_parts]
				}

				responseMessage.metadata = {
					...(responseMessage.metadata ?? {}),
					timestamp: Date.now(),
					sender: agent.name,
					sender_id: agent.id,
					sender_role: agent.role,
					group_id: s.group_id,
					group_name: s.group.name,
					group_turn_id: turn_id,
					leadership: evaluation.leadership
				} satisfies MessageMetadata

				await s.appendMessage(responseMessage)
				s.sync()
			},
			onError: error => {
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

					const duration_chunk = getPartDurationChunk(chunk, tracker)

					if (duration_chunk) {
						duration_parts.push(duration_chunk)
						controller.enqueue(duration_chunk)
					}
				}
			})
		)

	const [merge_stream, wait_stream] = stream.tee()

	return {
		stream: merge_stream,
		done: consumeStream({
			stream: wait_stream
		})
	}
}
