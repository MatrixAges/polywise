import { save } from '@core/io'
import { boolean, object, string, enum as zod_enum } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({ content: string(), for: zod_enum(['linkcase', 'wiki', 'memory', 'user']) })
const output_type = object({ ok: boolean(), id: string() })

export default p
	.meta({ openapi: { method: 'POST', path: '/save' } })
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		const { content, for: for_type } = input

		const id = await save({ type: 'article', content: content, for: for_type })

		return { ok: true, id }
	})
