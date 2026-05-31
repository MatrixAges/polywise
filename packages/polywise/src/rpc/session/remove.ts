import { p } from '@core/utils'
import { object, string } from 'zod'

import { session_select_schema } from '../../db/schemas'
import { removeSessionById } from './utils'

const input_type = object({ id: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/session/remove',
			description: 'Remove a session'
		}
	})
	.input(input_type)
	.output(session_select_schema.nullable())
	.mutation(async ({ input }) => {
		return removeSessionById(input.id)
	})
