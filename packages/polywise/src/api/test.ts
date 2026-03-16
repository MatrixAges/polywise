import { guard } from '@core/utils'
import { infer as Infer, number, object, string } from 'zod'

import type { GetValidateData, HonoContext } from '@core/types'
import type { TypedResponse } from 'hono'

const input_type = object({
	id: string()
})

const output_type = object({ timestamp: number() })

type Input = Infer<typeof input_type>
type Output = Promise<TypedResponse<Infer<typeof output_type>>>

const handler = async (c: HonoContext<GetValidateData<Input>>): Output => {
	return c.json({ timestamp: Date.now() })
}

export default {
	validator: guard('query', input_type),
	handler
}
