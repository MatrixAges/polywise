import { boolean, date, number, object, string } from 'zod'

import { p } from '../../utils/trpc'
import { queryPosts } from './utils'

const input_type = object({
	page: number().int().min(1),
	for_type: string().optional(),
	query: string().optional()
})
const output_type = object({
	list: object({
		id: string(),
		title: string().nullable(),
		for_type: string(),
		is_pipelined: boolean(),
		created_at: date().nullable(),
		updated_at: date().nullable(),
		related_article_count: number(),
		session_id: string().nullable(),
		content_preview: string(),
		has_session: boolean()
	}).array(),
	has_more: boolean()
})

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/post/query',
			summary: 'Query posts'
		},
		cli: {
			group: ['post'],
			name: 'query',
			summary: 'Query posts.'
		}
	})
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => queryPosts(input))
