import dayjs from 'dayjs'
import { object, string } from 'zod'

import { addSession } from '../../db/services'
import { addGroupSession } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const input_type = object({
	group_id: string(),
	title: string().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/group/createSession',
			description: 'Create a new chat session linked to a group.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const session = await addSession({
			title: input.title || `Group ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
		})

		await addGroupSession(input.group_id, session.id)

		return session
	})
