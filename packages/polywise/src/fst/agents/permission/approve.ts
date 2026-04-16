import getPermissionPrompt from '@core/consts/prompts/getPermissionPrompt'
import { SessionEventStore } from '@core/utils'

import createPermissionAgent from './agent'
import extract from './extract'
import { formatContext, formatPermissions } from './format'

import type Session from '../../session'
import type { Permission } from '../../types'
import type { PermissionAgentOutput } from './agent'

export default async (s: Session, tool: string, action: string, path: string) => {
	const agent = createPermissionAgent(s.model.model)

	const context_summary = formatContext(s.context)
	const recent_messages = s.model_messages.slice(-4).map(extract).filter(Boolean).join('\n')
	const approved_permissions = formatPermissions(s.permissions)

	const res = await agent.generate({
		prompt: getPermissionPrompt({
			tool,
			action,
			path,
			files_dir: s.files_dir,
			cwd: s.cwd,
			context_summary,
			recent_messages,
			approved_permissions
		})
	})

	if ((res.output as PermissionAgentOutput)?.approve) {
		const permission: Permission = {
			tool: tool as Permission['tool'],
			action: action as Permission['action'],
			path
		}

		s.permissions.push(permission)

		return true
	}

	s.permission = {
		tool: tool as Permission['tool'],
		action: action as Permission['action'],
		path
	}

	s.sync()

	const { promise, resolve } = Promise.withResolvers<boolean>()

	SessionEventStore.once(`${s.id}/permission`, (v: boolean) => resolve(v))

	const approved = await promise

	s.permission = null
	s.sync()

	if (approved) {
		const permission: Permission = {
			tool: tool as Permission['tool'],
			action: action as Permission['action'],
			path
		}

		s.permissions.push(permission)
	}

	return approved
}
