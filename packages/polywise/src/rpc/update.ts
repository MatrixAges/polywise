import { update } from '@core/io'
import { boolean, object, string } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({ id: string(), content: string() })
const output_type = object({ ok: boolean() })

export default p
	.meta({ openapi: { method: 'POST', path: '/update' } })
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		const { id, content } = input

		await update(id, content)

		return { ok: true }
	})
