import { SessionEventStore } from '@core/utils'

import createPermissionAgent from './agent'
import getPrompt from './getPrompt'

import type Session from '../../session'
import type { Permission } from '../../types'
import type { PermissionAgentOutput } from './agent'

export default async (s: Session, tool: string, action: string, path: string) => {
	const agent = createPermissionAgent(s.model.model)

	const res = await agent.generate({ prompt: getPrompt(s, tool, action, path) })

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
