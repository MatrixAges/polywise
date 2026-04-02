import { SessionEventStore } from '@core/utils'

import buildAuditPrompt from './buildAuditPrompt'
import createPermissionAgent from './createPermissionAgent'

import type { Permission } from '../../types'
import type Index from '../index'
import type { PermissionAgentOutput } from './createPermissionAgent'

export default async (s: Index, tool: string, action: string, path: string): Promise<boolean> => {
	const agent = createPermissionAgent(s.model.model)

	const audit_result = await agent.generate({
		prompt: buildAuditPrompt(s, tool, action, path)
	})

	if ((audit_result.output as PermissionAgentOutput)?.approve) {
		const permission: Permission = {
			tool: tool as Permission['tool'],
			action: action as Permission['action'],
			path
		}

		s.permissions.push(permission)

		return true
	}

	s.event.emit(`${s.id}/change`, {
		type: 'permission',
		data: { tool, action, path }
	})

	const { promise, resolve } = Promise.withResolvers<boolean>()

	SessionEventStore.once(`${s.id}/permission`, (v: boolean) => resolve(v))

	const approved = await promise

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
