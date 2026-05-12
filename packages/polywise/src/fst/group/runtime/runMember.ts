import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { createSystemTool } from '@core/fst/agents'
import { createPartDurationTracker, getPartDurationChunk } from '@core/fst/duration'
import { loadMcpTools } from '@core/fst/mcp'
import {
	createContentTool,
	createEditFileTool,
	createGlobTool,
	createMetaTool,
	createSearchFileTool,
	createWebFetchTool,
	createWebSearchTool,
	getCustomToolsPrompt,
	getSkillPrompt
} from '@core/fst/tools'
import { createBashTool } from '@core/fst/tools/bash'
import { getSystemTools } from '@core/utils'
import { consumeStream, smoothStream, stepCountIs, streamText } from 'ai'
import dayjs from 'dayjs'
import { getId } from 'stk/utils'

import { sanitizeToolSet, wrapToolSetWithAgentLogging } from '../../utils'
import { createGroupCoordinationTool } from '../tools/coordination'
import { createGroupMemberTool } from '../tools/member'
import { createGroupProgressTool } from '../tools/progress'
import getAgentModel from './getAgentModel'

import type { Agent } from '@core/db'
import type { ModelMessage, ToolSet, UIMessageChunk } from 'ai'
import type { Message, MessageDataParts, MessageMetadata, MessagePartDurationUIPart } from '../../types'
import type Group from '../index'
import type { GroupMemberEvaluation } from '../types'

const getAgentProfilePrompt = (agent: Agent) =>
	[
		'# Group Member Profile',
		`Name: ${agent.name}`,
		agent.identity ? `Identity:\n${agent.identity}` : '',
		agent.soul ? `Soul:\n${agent.soul}` : '',
		agent.memory ? `Memory:\n${agent.memory}` : '',
		agent.prompt ? `Prompt:\n${agent.prompt}` : '',
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
	const model = await getAgentModel(agent)
	const bash_tool = await createBashTool(s)
	const mcp_tools = await loadMcpTools(s)
	const system_tools_prompt = await getSystemTools()
	const custom_tools_prompt = getCustomToolsPrompt(s.custom_tools_map)
	const skill_prompt = getSkillPrompt(s.skill_map)

	const ensureWriteLock = async () => {
		if (s.write_lock.agent_id !== agent.id) {
			throw new Error(
				'Acquire the group write lock with group_coordination_tool before using write-capable tools.'
			)
		}
	}

	const tools = wrapToolSetWithAgentLogging(
		s,
		sanitizeToolSet({
			...mcp_tools,
			...model.tools,
			group_progress_tool: createGroupProgressTool(s, agent),
			group_coordination_tool: createGroupCoordinationTool(s, agent),
			group_member_tool: createGroupMemberTool(s, agent),
			meta_tool: createMetaTool(s),
			glob_tool: createGlobTool(s),
			search_file_tool: createSearchFileTool(s, bash_tool.env),
			content_tool: createContentTool(s),
			web_search_tool: createWebSearchTool(),
			web_fetch_tool: createWebFetchTool(),
			system_tool: createSystemTool(s),
			read_file_tool: bash_tool.readFile,
			bash_tool: gateWriteTool(
				bash_tool.bash,
				ensureWriteLock,
				'Requires the group write lock before execution.'
			),
			write_file_tool: gateWriteTool(
				bash_tool.writeFile,
				ensureWriteLock,
				'Requires the group write lock before execution.'
			),
			edit_file_tool: gateWriteTool(
				createEditFileTool(s),
				ensureWriteLock,
				'Requires the group write lock before execution.'
			)
		} as ToolSet)
	)

	const system_prompt = [
		fst_system_prompt,
		getAgentProfilePrompt(agent),
		'# Group Runtime Rules',
		`Group Name: ${s.group.name}`,
		s.group.description ? `Group Description: ${s.group.description}` : '',
		getMountedFolderPrompt(s),
		`Leadership Mode For This Turn: ${evaluation.leadership}`,
		evaluation.reason ? `Selection Reason: ${evaluation.reason}` : '',
		evaluation.needs_write_lock
			? 'Your work is expected to need shared writes. Acquire the group write lock before any write-capable tool use.'
			: 'Only acquire the group write lock if you truly need shared writes.',
		'Only your own profile is preloaded. Use group_member_tool to inspect specific members on demand.',
		'You can update shared context with group_progress_tool and shared todos/lock state with group_coordination_tool.',
		'Do not wait for or react to other agents in the same turn. Work from the shared history and current group context only.',
		system_tools_prompt,
		custom_tools_prompt,
		skill_prompt,
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
				if (part.type !== 'finish') return

				return {
					usage: part.totalUsage,
					timestamp: Date.now(),
					sender: agent.name,
					sender_id: agent.id,
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
			stream: wait_stream,
			onError: s.manual_abort ? undefined : undefined
		})
	}
}
