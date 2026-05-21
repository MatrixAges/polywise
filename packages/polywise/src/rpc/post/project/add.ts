import { project } from '@core/db/schema'
import { getProject } from '@core/db/services'
import { addPostProject } from '@core/db/services/externals'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../../utils/trpc'
import { getPostById } from '../utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/post/project/add',
			summary: 'Run Add'
		}
	})
	.input(
		object({
			post_id: string(),
			project_id: string()
		})
	)
	.mutation(async ({ input }) => {
		const [post, target_project] = await Promise.all([
			getPostById(input.post_id),
			getProject(eq(project.id, input.project_id))
		])

		if (!post) {
			throw new Error(`Post not found: ${input.post_id}`)
		}

		if (!target_project) {
			throw new Error(`Project not found: ${input.project_id}`)
		}

		await addPostProject(input.post_id, input.project_id)

		return { ok: true }
	})
