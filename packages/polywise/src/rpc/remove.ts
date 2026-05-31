import { remove } from '@core/io'
import { boolean, object, string } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({ id: string() })
const output_type = object({ ok: boolean() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/remove',
			description: 'Remove one article or knowledge record by id.'
		}
	})
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		const { id } = input

		await remove(id)

		return { ok: true }
	})
