import { save } from '@core/io'
import { boolean, object, string } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({ id: string(), content: string() })
const output_type = object({ ok: boolean(), id: string() })

export default p
	.meta({ openapi: { method: 'POST', path: '/update' } })
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		const { id, content } = input

		const updated_id = await save({ type: 'article', content: content, id })

		return { ok: true, id: updated_id }
	})
