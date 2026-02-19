import { p, router } from '@desktop/utils'
import { array, object, string } from 'zod'

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
		return await ctx.poly.save(input)
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

export default router({
	query,
	save,
	update,
	forget
})
