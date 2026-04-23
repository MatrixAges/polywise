import { project } from '@core/db/schema'
import { eq } from 'drizzle-orm'
import { number, object } from 'zod'

import { getProjects, setProject } from '../../db/services'
import { p } from '../../utils/trpc'

const input_type = object({ from: number().int(), to: number().int() })

export default p.input(input_type).mutation(async ({ input }) => {
	const projects = await getProjects()
	const next_projects = [...projects]
	const [target_project] = next_projects.splice(input.from, 1)

	if (!target_project) {
		return projects
	}

	next_projects.splice(input.to, 0, target_project)

	await Promise.all(next_projects.map((item, index) => setProject(eq(project.id, item.id), { order: index })))

	return next_projects
})
