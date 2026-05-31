import { post_project } from '@core/db/schema'
import { removePostProject } from '@core/db/services/externals'
import { and, eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../../utils/trpc'
import { getPostById } from '../utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/project/remove',
			description: 'Unlink a project from a post.'
		}
	})
	.input(
		object({
			post_id: string(),
			project_id: string()
		})
	)
	.mutation(async ({ input }) => {
		const post = await getPostById(input.post_id)

		if (!post) {
			throw new Error(`Post not found: ${input.post_id}`)
		}

		const where = and(eq(post_project.post_id, input.post_id), eq(post_project.project_id, input.project_id))

		await removePostProject(where!)

		return { ok: true }
	})
