import { p } from '@core/utils'
import { object, string } from 'zod'

import { removeSessionById } from './utils'

const input_type = object({ id: string() })

export default p.input(input_type).mutation(async ({ input }) => {
	return removeSessionById(input.id)
})
