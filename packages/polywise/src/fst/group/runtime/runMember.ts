import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { createPartDurationTracker, getPartDurationChunk } from '@core/fst/duration'
import { buildSharedRuntimeTools } from '@core/fst/tools'
import { consumeStream, smoothStream, stepCountIs, streamText } from 'ai'
import dayjs from 'dayjs'
import { getId } from 'stk/utils'

import { sanitizeToolSet, wrapToolSetWithAgentLogging } from '../../utils'
import { createGroupCoordinationTool } from '../tools/coordination'
import { createGroupMemberTool } from '../tools/member'
import { createGroupProgressTool } from '../tools/progress'
import getAgentModel from './getAgentModel'
import getAgentsMapPrompt from './getAgentsMapPrompt'

import type { Agent } from '@core/db'
import type { ModelMessage, UIMessageChunk } from 'ai'
import type { Message, MessageDataParts, MessageMetadata, MessagePartDurationUIPart } from '../../types'
import type Group from '../index'
import type { GroupMemberEvaluation } from '../types'

const getAgentProfilePrompt = (agent: Agent) =>
	[
		'# Group Member Profile',
		`Name: ${agent.name}`,
		`Role: ${agent.role}`,
		agent.identity ? `Identity:\n${agent.identity}` : '',
		agent.soul ? `Soul:\n${agent.soul}` : '',
		agent.memory ? `Memory:\n${agent.memory}` : '',
		agent.prompt ? `Prompt:\n${agent.prompt}` : '',
		'You are this exact member only.',
		'Never claim to be another group member unless your exact name is that member.',
		'Do not introduce yourself unless the user explicitly asks who you are; the UI already shows your name and role.',
		'Do not imitate, role-play, or speak as another member even if the user asked for that member.',
		'Reply to the user or shared task directly. Do not critique other agents in this turn.'
	]
		.filter(Boolean)
		.join('\n\n')

const getMountedFolderPrompt = (s: Group) => {
	if (!s.folders.length) {
		return ''
	}

	const lines = ['# Mounted Group Folders', `- / -> ${s.cwd}`]

	for (const mount of s.additional_mounts) {
		lines.push(`- ${mount.mountPoint} -> ${mount.path}`)
	}

	lines.push('Use these mounted paths when reading or writing files for the group.')

	return lines.join('\n')
}

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
	console.log('[group-debug][runMember] start', {
		session_id: s.id,
		group_id: s.group_id,
		turn_id,
		agent_id: agent.id,
		agent_name: agent.name,
		leadership: evaluation.leadership,
		needs_write_lock: evaluation.needs_write_lock
	})
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
			group_member_tool: createGroupMemberTool(s, agent)
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

	const system_prompt = [
		fst_system_prompt,
		getAgentProfilePrompt(agent),
		'# Group Runtime Rules',
		`Group Name: ${s.group.name}`,
		s.group.description ? `Group Description: ${s.group.description}` : '',
		getAgentsMapPrompt(s),
		getMountedFolderPrompt(s),
		`Leadership Mode For This Turn: ${evaluation.leadership}`,
		evaluation.reason ? `Selection Reason: ${evaluation.reason}` : '',
		`Current Active Member: ${agent.name} (${agent.role})`,
		evaluation.needs_write_lock
			? 'Your work is expected to need shared writes. Acquire the group write lock before any write-capable tool use.'
			: 'Only acquire the group write lock if you truly need shared writes.',
		'Only your own full profile is preloaded. Use group_member_tool to inspect specific members on demand.',
		'Never say or imply that you are another member from the group agents map.',
		'If the user asked for another member or role, you still must not impersonate them. Answer only as yourself.',
		'The group agents map exists only so you know who else exists. Do not write sections for other members, simulate their opinions, or answer as a whole panel unless the user explicitly asked for a multi-member synthesis.',
		'Do not speak on behalf of other members or summarize what they would say unless the user explicitly asked for a cross-member synthesis.',
		'Do not address other members by name inside the final user-facing answer, do not assign them tasks, and do not ask them questions there.',
		'Your final answer must be a self-contained response to the user from your own role only.',
		'You can update shared context with group_progress_tool and shared todos/lock state with group_coordination_tool.',
		'Use group_coordination_tool and group_progress_tool silently for internal state only, not as a cue to narrate team dispatching in the final answer.',
		'Do not wait for or react to other agents in the same turn. Work from the shared history and current group context only.',
		shared_runtime.system_tools_prompt,
		shared_runtime.custom_tools_prompt,
		shared_runtime.skill_prompt,
		getContextPrompt(s.context),
		`Current Session Title: ${s.session.title}`,
		`Real World Date: ${dayjs().format('YYYY-MM-DD')}`
	]
		.filter(Boolean)
		.join('\n\n')

	const tracker = createPartDurationTracker()
	const res = streamText({
		model: model.model,
		system: system_prompt,
		messages,
		tools,
		abortSignal: s.abort_controller.signal,
		providerOptions: model.provider_options,
		stopWhen: stepCountIs(180),
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
				console.log('[group-debug][runMember] finish', {
					session_id: s.id,
					group_id: s.group_id,
					turn_id,
					agent_id: agent.id,
					agent_name: agent.name,
					part_count: responseMessage.parts.length
				})
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
				console.log('[group-debug][runMember] stream-error', {
					session_id: s.id,
					group_id: s.group_id,
					turn_id,
					agent_id: agent.id,
					agent_name: agent.name,
					error: error instanceof Error ? error.message : String(error),
					manual_abort: s.manual_abort
				})
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
			stream: wait_stream,
			onError: error => {
				console.log('[group-debug][runMember] consume-error', {
					session_id: s.id,
					group_id: s.group_id,
					turn_id,
					agent_id: agent.id,
					agent_name: agent.name,
					error: error instanceof Error ? error.message : String(error)
				})
			}
		})
	}
}
