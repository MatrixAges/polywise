import { project } from '@core/db/schema'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { getProjectSessions, removeProject } from '../../db/services'
import { p } from '../../utils/trpc'
import { removeSessionById } from '../session/utils'

const input_type = object({ id: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/project/remove',
			description: 'Delete a project and remove all sessions linked to it.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const session_rows = await getProjectSessions({ project_id: input.id })

		for (const item of session_rows) {
			await removeSessionById(item.session.id)
		}

		return removeProject(eq(project.id, input.id))
	})
