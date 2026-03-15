import { save } from '@core/io'
import { boolean, object, string } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({ content: string() })
const output_type = object({ ok: boolean() })

export default p
	.meta({ openapi: { method: 'POST', path: '/save' } })
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const { content } = input

		await save({ type: 'article', content: content })

		return { ok: true }
	})
