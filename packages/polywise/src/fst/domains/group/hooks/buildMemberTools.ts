import { buildSharedRuntimeTools, createMessageTool } from '@core/fst/tools'

import createGroupCoordinationTool from '../tools/createGroupCoordinationTool'
import createGroupMemberTool from '../tools/createGroupMemberTool'
import createGroupProgressTool from '../tools/createGroupProgressTool'

import type Session from '../../../session'
import type { GroupMemberToolState } from '../types'

const gateWriteTool = <T extends { execute?: (...args: Array<any>) => any }>(
	toolItem: T,
	check: () => Promise<void>,
	appendDescription = ''
) => {
	const execute = toolItem.execute?.bind(toolItem)
	const description = String((toolItem as { description?: string }).description || '')

	return {
		...toolItem,
		...(appendDescription ? { description: `${description}\n${appendDescription}`.trim() } : {}),
		execute: async (...args: Array<any>) => {
			await check()

			return execute?.(...args)
		}
	} as T
}

export default async (s: Session, state: GroupMemberToolState) => {
	if (state.runtime) {
		return state
	}

	const ensureWriteLock = async () => {
		if (s.write_lock.agent_id !== state.agent.id) {
			throw new Error(
				'Acquire the group write lock with group_coordination_tool before using write-capable tools.'
			)
		}
	}

	state.runtime = await buildSharedRuntimeTools({
		s,
		model_tools: state.modelTools,
		extra_tools: {
			group_progress_tool: createGroupProgressTool(s, state.agent),
			group_coordination_tool: createGroupCoordinationTool(s, state.agent),
			group_member_tool: createGroupMemberTool(s, state.agent),
			message_tool: createMessageTool(s)
		},
		transform_tool: (key, toolItem) => {
			if (key === 'bash_tool' || key === 'write_file_tool' || key === 'edit_file_tool') {
				return gateWriteTool(
					toolItem as { execute?: (...args: Array<any>) => any },
					ensureWriteLock,
					'Requires the group write lock before execution.'
				) as typeof toolItem
			}

			return toolItem
		}
	})

	return state
}
