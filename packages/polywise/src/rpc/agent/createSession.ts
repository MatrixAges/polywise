import dayjs from 'dayjs'
import { object, string } from 'zod'

import { addSession } from '../../db/services'
import { addAgentSession } from '../../db/services/externals'
import { p } from '../../utils/trpc'

const input_type = object({
	agent_id: string(),
	title: string().optional()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/createSession',
			summary: 'Run Create Session'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const title = input.title || `Session ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
		const session = await addSession({ title })

		await addAgentSession(input.agent_id, session.id)

		return session
	})
