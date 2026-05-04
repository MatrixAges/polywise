import { getProjects, getProjectTodo, getStandaloneTodos } from '@core/db/services'
import { p } from '@core/utils'
import { and, eq, ne } from 'drizzle-orm'

import { project_todo, todo } from '../../db/schema'

export default p.query(async () => {
	const inbox_rows = await getStandaloneTodos({ where: ne(todo.status, 'archive') })
	const projects = await getProjects({ orderBy: 'asc' })

	const project_menu_data = await Promise.all(
		projects.map(async project => {
			const project_rows = await getProjectTodo({
				where: and(eq(project_todo.project_id, project.id), ne(todo.status, 'archive'))
			})

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
