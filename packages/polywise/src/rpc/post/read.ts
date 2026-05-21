import { boolean, date, number, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { getPostById } from './utils'

const input_type = object({ id: string() })
const output_type = object({
	id: string(),
	title: string().nullable(),
	content: string(),
	for_type: string(),
	is_pipelined: boolean(),
	created_at: date().nullable(),
	updated_at: date().nullable(),
	related_article_count: number(),
	session_id: string().nullable()
})

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/post/read',
			summary: 'Read a post'
		},
		cli: {
			group: ['post'],
			name: 'read',
			summary: 'Read one post.'
		}
	})
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const post = await getPostById(input.id)

		if (!post) {
			throw new Error(`Post not found: ${input.id}`)
		}

		return post
	})
