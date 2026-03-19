import { search } from '@core/io'
import { array, boolean, literal, number, object, string, union } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({
	query: string(),
	intent: string().optional(),
	rank_by_time: boolean().optional(),
	return_article: boolean().optional()
})

const chunk_output = object({
	type: literal('chunk'),
	results: array(
		object({
			chunk_id: string(),
			content: string(),
			rrf_score: number(),
			normalized_rrf_score: number(),
			rrf_rank: number(),
			reranker_score: number(),
			final_score: number()
		})
	)
})

const article_output = object({
	type: literal('article'),
	results: array(
		object({
			article_id: string(),
			article_title: string().nullable(),
			article_url: string().nullable(),
			article_content: string(),
			chunk_id: string(),
			content: string(),
			reranker_score: number(),
			final_score: number()
		})
	)
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
