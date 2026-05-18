import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { getPostById } from './utils'

export default p.input(object({ id: string() })).query(async ({ input }) => {
	const post = await getPostById(input.id)

	if (!post) {
		throw new Error(`Post not found: ${input.id}`)
	}

	return post
})
