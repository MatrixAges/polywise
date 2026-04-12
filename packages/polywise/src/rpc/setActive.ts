import { boolean, object } from 'zod'

import { setActive } from '../env'
import { p } from '../utils/trpc'

const input_type = object({ active: boolean() })
const output_type = object({ ok: boolean() })

export default p
	.meta({ openapi: { method: 'POST', path: '/setActive' } })
	.input(input_type)
	.output(output_type)
	.mutation(({ input }) => {
		setActive(input.active)

		return { ok: true }
	})
