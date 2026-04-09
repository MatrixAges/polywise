import { save } from '@core/io'
import { boolean, object, string, enum as zod_enum } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({ id: string(), content: string(), for: zod_enum(['linkcase', 'wiki', 'memory', 'user']) })
const output_type = object({ ok: boolean(), id: string() })

export default p
	.meta({ openapi: { method: 'POST', path: '/update' } })
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		const { id, content, for: for_type } = input

		const updated_id = await save({ type: 'article', content: content, for: for_type, id })

		return { ok: true, id: updated_id }
	})
