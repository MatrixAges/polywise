import inspect from '@core/io/search/inspect'
import { array, boolean, literal, number, object, string, union } from 'zod'

import { p } from '../utils/trpc'
import { input_type as search_input_type } from './SemanticSearch'

const scope_type = union([literal('global'), literal('project'), literal('agent')])

const result_shape = object({
	id: string(),
	content: string(),
	score: number(),
	updated_at: string().datetime().nullable(),
	scope_type: scope_type.nullable(),
	scope_id: string().nullable()
})

const branch_result_shape = object({
	chunk_id: string(),
	rank: number()
})

const rrf_result_shape = object({
	chunk_id: string(),
	rrf_score: number(),
	normalized_rrf_score: number(),
	rrf_rank: number(),
	from_recall: boolean(),
	from_keyword: boolean()
})

const filtered_result_shape = rrf_result_shape.extend({
	similarity: number()
})

const article_score_shape = object({
	article_id: string(),
	chunk_id: string(),
	rrf_score: number(),
	normalized_rrf_score: number(),
	rrf_rank: number(),
	from_keyword: boolean().optional(),
	updated_at: string().datetime().nullable(),
	scope_type: string().nullable(),
	scope_id: string().nullable()
})

const search_target_shape = object({
	keywords: string(),
	question: string(),
	answer: string(),
	rerank_query: string()
})

const recall_result_shape = object({
	chunk_ids: array(string()),
	article_ids: array(string())
})

const output_shape = union([
	object({
		type: literal('chunk'),
		results: array(result_shape)
	}),
	object({
		type: literal('article'),
		results: array(result_shape)
	})
])

const input_type = search_input_type
	.extend({
		search_target_override: object({
			keywords: string(),
			question: string(),
			answer: string()
		})
			.strict()
			.optional(),
		branch_results_override: object({
			keyword_chunk_ids: array(string()).optional(),
			question_chunk_ids: array(string()).optional(),
			answer_chunk_ids: array(string()).optional(),
			recall_chunk_ids: array(string()).optional(),
			recall_article_ids: array(string()).optional()
		})
			.strict()
			.optional()
	})
	.strict()

const output_type = object({
	search_target: search_target_shape,
	recall_result: recall_result_shape,
	keyword_results: array(branch_result_shape),
	question_results: array(branch_result_shape),
	answer_results: array(branch_result_shape),
	rrf_results: array(rrf_result_shape),
	filtered_results: array(filtered_result_shape),
	article_scores: array(article_score_shape),
	output: output_shape
})

export default p
	.meta({ openapi: { method: 'POST', path: '/inspect' } })
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		return inspect(input)
	})
