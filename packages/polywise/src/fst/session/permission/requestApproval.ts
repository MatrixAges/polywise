import { SessionEventStore } from '@core/utils'

import type { Permission } from '../../types'
import type Index from '../index'

export default async (s: Index, tool: string, action: string, path: string): Promise<boolean> => {
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
