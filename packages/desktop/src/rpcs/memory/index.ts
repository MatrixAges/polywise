import { p, router } from '@desktop/utils'
import { array, number, object, string } from 'zod'

const query = p
	.input(
		object({
			query: string(),
			idol_id: string().optional(),
			root_ids: array(string()).optional(),
			metrics_ids: array(string()).optional()
		})
	)
	.query(async ({ input, ctx }) => {
		return await ctx.poly.query(input)
	})

const save = p
	.input(
		object({
			content: string(),
			idol_id: string().optional(),
			root_ids: array(string()).optional(),
			metrics_ids: array(string()).optional(),
			metadata: object({}).passthrough().optional()
		})
	)
	.mutation(async ({ input, ctx }) => {
		const article = await ctx.poly.article.process(input)

		if (!article?.id) {
			throw new Error('Failed to save memory')
		}

		return article.id
	})

const update = p
	.input(
		object({
			memory_id: string(),
			content: string(),
			idol_id: string().optional(),
			root_ids: array(string()).optional(),
			metrics_ids: array(string()).optional(),
			metadata: object({}).passthrough().optional()
		})
	)
	.mutation(async ({ input, ctx }) => {
		return await ctx.poly.update(input)
	})

const forget = p
	.input(
		object({
			memory_id: string().optional(),
			query: string().optional(),
			idol_id: string().optional(),
			root_ids: array(string()).optional(),
			metrics_ids: array(string()).optional()
		})
	)
	.mutation(async ({ input, ctx }) => {
		return await ctx.poly.forget(input)
	})

const snapshot = p
	.input(
		object({
			weight_threshold: number().optional()
		})
	)
	.query(async ({ input, ctx }) => {
		return await ctx.poly.getSnapshot(input.weight_threshold)
	})

const getNodes = p.query(async ({ ctx }) => {
	return await ctx.poly.getAllNodes()
})

const getNodesByIdol = p
	.input(
		object({
			idol_id: string()
		})
	)
	.query(async ({ input, ctx }) => {
		return await ctx.poly.getNodesByIdol(input.idol_id)
	})

const getEdgesByIdol = p
	.input(
		object({
			idol_id: string()
		})
	)
	.query(async ({ input, ctx }) => {
		return await ctx.poly.getEdgesByIdol(input.idol_id)
	})

export default router({
	query,
	save,
	update,
	forget,
	snapshot,
	getNodes,
	getNodesByIdol,
	getEdgesByIdol
})
