import getContextPrompt from '@core/consts/prompts/getContextPrompt'
import { getGroupRunMemberPrompt } from '@core/consts/prompts/getGroupPrompt'
import { stepCountIs } from 'ai'
import dayjs from 'dayjs'

import type Session from '../../../session'
import type { GroupMemberPromptState } from '../types'

const stopAfterTerminalInternalTool = ({
	steps
}: {
	steps: Array<{ text: string; toolCalls: Array<{ toolName: string }> }>
}) => {
	const lastStep = steps[steps.length - 1]

	if (!lastStep) {
		return false
	}

	const hasTerminalInternalTool = lastStep.toolCalls.some(
		toolCall => toolCall.toolName === 'group_progress_tool' || toolCall.toolName === 'group_coordination_tool'
	)

	if (!hasTerminalInternalTool) {
		return false
	}

	return steps.some(step => step.text.trim().length > 0)
}

export default (s: Session, state: GroupMemberPromptState) => {
	if (!state.system) {
		const runtime = state.tools.runtime as any

		state.system = getGroupRunMemberPrompt({
			agent: state.agent,
			evaluation: state.evaluation,
			group_name: s.group!.name,
			group_description: s.group!.description,
			has_mounted_folders: s.folders.length > 0,
			cwd: s.cwd,
			additional_mounts: s.additional_mounts,
			has_system_tool: runtime.has_system_tool,
			system_tools_prompt: runtime.system_tools_prompt,
			custom_tools_prompt: runtime.custom_tools_prompt,
			skill_prompt: runtime.skill_prompt,
			context_prompt: getContextPrompt(s.context),
			session_title: s.session.title,
			real_world_date: dayjs().format('YYYY-MM-DD')
		})
	}

	if (!state.stopWhen.length) {
		state.stopWhen = [stepCountIs(180), stopAfterTerminalInternalTool]
	}

	return state
}
