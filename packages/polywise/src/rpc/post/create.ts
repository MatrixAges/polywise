import { boolean, object, string } from 'zod'

import { saveArticle } from '../../io'
import { p } from '../../utils/trpc'
import { getPostById, normalizePostForType } from './utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/create',
			summary: 'Run Create'
		}
	})
	.input(
		object({
			title: string().optional(),
			content: string().optional(),
			for_type: string(),
			exec_pipeline: boolean().optional()
		})
	)
	.mutation(async ({ input }) => {
		const id = await saveArticle({
			title: input.title,
			content: input.content ?? '',
			for: normalizePostForType(input.for_type),
			exec_pipeline: input.exec_pipeline
		})

		return getPostById(id)
	})
