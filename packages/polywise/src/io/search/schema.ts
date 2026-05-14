import { array, boolean, literal, number, object, string, union } from 'zod'

const scope_type = union([literal('global'), literal('project'), literal('agent')])

export const input_type = object({
	query: string(),
	intent: string().optional(),
	enable_rewrite: boolean().optional(),
	enable_recall: boolean().optional(),
	depth: number().int().min(1).max(6).optional(),
	type: union([literal('chunk'), literal('article')]).optional(),
	for_types: array(union([literal('linkcase'), literal('wiki'), literal('memory'), literal('user')])).optional(),
	scope_type: scope_type.optional(),
	scope_id: string().optional()
}).strict()

const result_shape = object({
	id: string(),
	content: string(),
	score: number(),
	updated_at: string().datetime().nullable(),
	scope_type: scope_type.nullable(),
	scope_id: string().nullable()
})

const chunk_output = object({
	type: literal('chunk'),
	results: array(result_shape)
})

const article_output = object({
	type: literal('article'),
	results: array(result_shape)
})

export const output_type = union([chunk_output, article_output])
