import { search } from '@core/io'
import { array, boolean, number, object, string } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({
	query: string(),
	intent: string().optional(),
	rank_by_time: boolean().optional()
})

const output_type = object({
	results: array(
		object({
			chunk_id: string(),
			rrf_score: number(),
			normalized_rrf_score: number(),
			rrf_rank: number(),
			reranker_score: number(),
			final_score: number()
		})
	)
})

export default p
	.meta({ openapi: { method: 'POST', path: '/search' } })
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const results = await search(input)

		return { results }
	})
