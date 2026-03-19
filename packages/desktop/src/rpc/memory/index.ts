import { p, router } from '@desktop/utils'
import * as taskUtil from '@desktop/utils/task'
import { any, array, number, object, string } from 'zod'

const writeLog = (event_name: string, payload?: Record<string, unknown>) => {
	if (payload) {
		console.log('[memory-rpc]', event_name, payload)
		return
	}

	console.log('[memory-rpc]', event_name)
}

const query = p
	.input(
		object({
			query: string(),
			idol_id: string().optional(),
			root_ids: array(string()).optional()
		})
	)
	.query(async ({ input, ctx }) => {
		writeLog('query_start')

		const result = await ctx.memory.query(input)

		writeLog('query_done')

		return result
	})

const save = p
	.input(
		object({
			content: string(),
			idol_id: string().optional(),
			root_ids: array(string()).optional(),
			metadata: object({}).passthrough().optional()
		})
	)
	.mutation(async ({ input, ctx }) => {
		writeLog('save_start')

		const result = await ctx.memory.save(input)

		writeLog('save_done')

		return result
	})

const update = p
	.input(
		object({
			memory_id: string(),
			content: string(),
			idol_id: string().optional(),
			root_ids: array(string()).optional(),
			metadata: object({}).passthrough().optional()
		})
	)
	.mutation(async ({ input, ctx }) => {
		return await ctx.memory.update(input)
	})

const forget = p
	.input(
		object({
			memory_id: string().optional(),
			query: string().optional(),
			idol_id: string().optional(),
			root_ids: array(string()).optional()
		})
	)
	.mutation(async ({ input, ctx }) => {
		return await ctx.memory.forget(input)
	})

const snapshot = p
	.input(
		object({
			weight_threshold: number().optional(),
			limit: number().optional()
		})
	)
	.query(async ({ input, ctx }) => {
		return await ctx.memory.snapshot({
			weight_threshold: input.weight_threshold,
			limit: input.limit
		})
	})

const recall = p
	.input(
		object({
			query: string(),
			max_depth: number().optional(),
			idol_id: string().optional(),
			root_ids: array(string()).optional(),
			limit: number().optional()
		})
	)
	.query(async ({ input, ctx }) => {
		// Ensure method exists before calling (runtime safety check)
		if (typeof ctx.memory.recall !== 'function') {
			throw new Error('Polywise.recall is not defined. Please restart the backend.')
		}

		return await ctx.memory.recall({
			query: input.query,
			max_depth: input.max_depth,
			idol_id: input.idol_id,
			root_ids: input.root_ids,
			limit: input.limit
		})
	})

const getNodeRelated = p
	.input(
		object({
			node_id: string(),
			depth: number().optional(),
			limit: number().optional()
		})
	)
	.query(async ({ input, ctx }) => {
		return await ctx.memory.getNodeRelated(input)
	})

const syncTasks = p
	.input(
		object({
			pending: array(any()),
			processing: array(any())
		})
	)
	.mutation(async ({ input }) => {
		return await taskUtil.syncTasks(input.pending, input.processing)
	})

const getTasks = p.query(async () => {
	return await taskUtil.getTasks()
})

const archiveTask = p
	.input(
		object({
			task: any()
		})
	)
	.mutation(async ({ input }) => {
		return await taskUtil.archiveTask(input.task)
	})

const getArchiveTasks = p
	.input(
		object({
			page: number()
		})
	)
	.query(async ({ input }) => {
		return await taskUtil.getArchiveTasks(input.page)
	})

export default router({
	query,
	save,
	update,
	forget,
	snapshot,
	recall,
	getNodeRelated,
	syncTasks,
	getTasks,
	archiveTask,
	getArchiveTasks
})
