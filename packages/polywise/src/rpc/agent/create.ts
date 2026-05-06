import { agent_create_input_schema } from '@core/db/schemas'
import { addAgent } from '@core/db/services'
import { p } from '@core/utils'

const input_type = agent_create_input_schema

export default p.input(input_type).mutation(async ({ input }) => {
	return addAgent({ ...input, order: Date.now() })
})
