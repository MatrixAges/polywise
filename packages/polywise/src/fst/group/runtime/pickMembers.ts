import fst_system_prompt from '@core/consts/prompts/fst_system_prompt.md'
import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { stepCountIs, ToolLoopAgent } from 'ai'

import { createGroupPickTool } from '../tools/pick'
import getAgentsMapPrompt from './getAgentsMapPrompt'

import type { ModelMessage } from 'ai'
import type Group from '../index'
import type { GroupPickedAgent } from '../types'

const stringifyMessageContent = (content: ModelMessage['content']) => {
	if (typeof content === 'string') {
		return content
	}

	if (!Array.isArray(content)) {
		return ''
	}

	return content
		.map(part => {
			if ('text' in part && typeof part.text === 'string') {
				return part.text
			}

			if ('type' in part && typeof part.type === 'string') {
				return `[${part.type}]`
			}

			return ''
		})
		.filter(Boolean)
		.join('\n')
}

const getConversationPrompt = (messages: Array<ModelMessage>) => {
	const recent_messages = messages.slice(-12)

	if (!recent_messages.length) {
		return ''
	}

	return [
		'# Recent Conversation',
		...recent_messages.map((message, index) => {
			const content = stringifyMessageContent(message.content).trim()

			return [`## ${index + 1}. ${message.role}`, content || '[no text content]'].join('\n')
		})
	].join('\n\n')
}

export default async (s: Group, messages: Array<ModelMessage>) => {
	await s.getModel()

	let picked = [] as Array<GroupPickedAgent>

	const agent = new ToolLoopAgent({
		model: s.model.model,
		instructions: [
			fst_system_prompt,
			'# Group Pick Task',
			'Choose which group members should be confirmed first for the current user turn.',
			'You are only routing confirmation priority, not deciding the final responders.',
			'Use group_pick_tool exactly once.',
			'Pick at most 3 members and prefer 1-2 when possible.',
			'Only pick members who are clearly promising first responders for this turn.',
			'If no member stands out, call the tool with an empty picks array.',
			`Group Name: ${s.group.name}`,
			s.group.description ? `Group Description: ${s.group.description}` : '',
			getAgentsMapPrompt(s),
			getContextPrompt(s.context)
		]
			.filter(Boolean)
			.join('\n\n'),
		tools: {
			group_pick_tool: createGroupPickTool(s, next_picks => {
				picked = next_picks
			})
		},
		stopWhen: stepCountIs(4),
		providerOptions: s.model.provider_options
	})

	try {
		await agent.generate({
			prompt: getConversationPrompt(messages),
			abortSignal: s.abort_controller.signal
		})
	} catch {
		return []
	}

	return picked
}
