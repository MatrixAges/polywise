import path from 'path'
import { app } from '@core/consts'
import { group, group_session } from '@core/db/schema'
import { getGroupSessions, removeGroup } from '@core/db/services'
import { eq } from 'drizzle-orm'
import fs from 'fs-extra'
import { string } from 'zod'

import { p } from '../../utils/trpc'
import { removeSessionById } from '../session/utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/group/remove',
			description: 'Run Remove'
		}
	})
	.input(string())
	.mutation(async ({ input }) => {
		const sessions = await getGroupSessions({
			where: eq(group_session.group_id, input)
		})

		for (const session_item of sessions) {
			await removeSessionById(session_item.session.id)
		}

		const removed = await removeGroup(eq(group.id, input))

		if (removed) {
			await fs.remove(path.resolve(app.app_path, 'groups', input))
		}

		return removed
	})
