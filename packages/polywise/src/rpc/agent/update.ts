import { agent } from '@core/db/schema'
import { agent_update_input_schema } from '@core/db/schemas'
import { setAgent } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { omit } from 'es-toolkit'

import type { AgentInsert } from '@core/db'

const input_type = agent_update_input_schema

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/update',
			summary: 'Run Update'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		return setAgent(eq(agent.id, input.id), omit(input, ['id']) as Partial<AgentInsert>)
	})
