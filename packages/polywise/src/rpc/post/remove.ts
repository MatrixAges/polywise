import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { removePostById } from './utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/remove',
			description: 'Delete one post.'
		}
	})
	.input(object({ id: string() }))
	.mutation(async ({ input }) => {
		const post = await removePostById(input.id)

		if (!post) {
			return { ok: true }
		}

		return { ok: true }
	})
