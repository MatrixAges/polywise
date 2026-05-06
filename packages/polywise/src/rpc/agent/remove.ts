import { agent } from '@core/db/schema'
import { removeAgent } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

const input_type = object({ id: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	return removeAgent(eq(agent.id, input.id))
})
