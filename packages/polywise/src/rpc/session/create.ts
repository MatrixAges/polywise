import dayjs from 'dayjs'
import { object, string } from 'zod'

import { session_select_schema } from '../../db/schemas'
import { addSession } from '../../db/services'
import { addProjectSession } from '../../db/services/externals/project_session'
import { p } from '../../utils/trpc'

const input_type = object({
	title: string().optional(),
	project_id: string().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/create',
			summary: 'Create a session'
		}
	})
	.input(input_type)
	.output(session_select_schema)
	.mutation(async ({ input }) => {
		const title = input.title || `Session ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
		const session = await addSession({ title })

		if (input.project_id) {
			await addProjectSession(input.project_id, session.id)
		}

		return session
	})
