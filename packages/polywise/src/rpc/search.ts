import { search } from '@core/io'
import { array, boolean, literal, number, object, string, union } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({
	query: string(),
	intent: string().optional(),
	rank_by_time: boolean().optional(),
	type: union([literal('chunk'), literal('article')]).optional()
}).strict()

const result_shape = object({
	id: string(),
	content: string(),
	score: number()
})

const chunk_output = object({
	type: literal('chunk'),
	results: array(result_shape)
})

const article_output = object({
	type: literal('article'),
	results: array(result_shape)
})

const output_type = union([chunk_output, article_output])

export default p
	.meta({ openapi: { method: 'GET', path: '/search' } })
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const results = await search(input)

		return results
	})
