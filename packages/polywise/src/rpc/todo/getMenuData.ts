import { getProjects, getProjectTodoCount, getStandaloneTodosCount, getTodosCount } from '@core/db/services'
import { p } from '@core/utils'
import { and, eq, ne } from 'drizzle-orm'

import { project_todo, todo } from '../../db/schema'

export default p.query(async () => {
	const inbox = await getStandaloneTodosCount(ne(todo.status, 'archive'))
	const archive = await getTodosCount(eq(todo.status, 'archive'))
	const projects = await getProjects({ orderBy: 'asc' })

	const project_menu_data = await Promise.all(
		projects.map(async project => {
			const count = await getProjectTodoCount(
				and(eq(project_todo.project_id, project.id), ne(todo.status, 'archive'))
			)

			return {
				project,
				count
			}
		})
	)

	return {
		inbox,
		archive,
		projects: project_menu_data
	}
})
