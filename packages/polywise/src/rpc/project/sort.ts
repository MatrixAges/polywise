import { project } from '@core/db/schema'
import { eq } from 'drizzle-orm'
import { number, object } from 'zod'

import { getProjects, setProject } from '../../db/services'
import arrayMove from '../../utils/arrayMove'
import { p } from '../../utils/trpc'

const input_type = object({ from: number().int(), to: number().int() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/project/sort',
			description: 'Reorder projects in the project list.'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		const projects = await getProjects({ orderBy: 'asc' })

		if (!projects[input.from] || input.to > projects.length - 1) {
			return projects
		}

		const next_projects = arrayMove({ list: projects, from: input.from, to: input.to })

		await Promise.all(next_projects.map((item, index) => setProject(eq(project.id, item.id), { order: index })))

		return next_projects
	})
