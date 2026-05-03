import { getProjects, getProjectTodo, getStandaloneTodos } from '@core/db/services'
import { p } from '@core/utils'
import { eq } from 'drizzle-orm'

import { project_todo } from '../../db/schema'

export default p.query(async () => {
	const inbox_rows = await getStandaloneTodos()
	const projects = await getProjects({ orderBy: 'asc' })

	const project_menu_data = await Promise.all(
		projects.map(async project => {
			const project_rows = await getProjectTodo({ where: eq(project_todo.project_id, project.id) })

			return {
				project,
				count: project_rows.length
			}
		})
	)

	return {
		inbox: inbox_rows.length,
		projects: project_menu_data
	}
})
