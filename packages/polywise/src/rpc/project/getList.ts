import { project_session, project_todo, session, todo } from '@core/db/schema'
import { env } from '@core/env'
import { desc, eq } from 'drizzle-orm'

import { getProjects } from '../../db/services'
import { p } from '../../utils/trpc'
import readProjectFile from './utils/readProjectFile'
import readProjectTree from './utils/readProjectTree'

import type { IProjectListData, IProjectSerializedProjectItem } from './types'

const serializeSessionItem = (args: { session_item: typeof session.$inferSelect; project_id: string }) => {
	const { session_item, project_id } = args

	return {
		...session_item,
		created_at: session_item.created_at ? session_item.created_at.toISOString() : null,
		updated_at: session_item.updated_at ? session_item.updated_at.toISOString() : null,
		project_id
	}
}

const serializeTodoItem = (args: { todo_item: typeof todo.$inferSelect; project_id: string }) => {
	const { todo_item, project_id } = args

	return {
		...todo_item,
		created_at: todo_item.created_at ? todo_item.created_at.toISOString() : null,
		updated_at: todo_item.updated_at ? todo_item.updated_at.toISOString() : null,
		completed_at: todo_item.completed_at ? todo_item.completed_at.toISOString() : null,
		due_at: todo_item.due_at ? todo_item.due_at.toISOString() : null,
		project_id
	}
}

export default p.query(async () => {
	const projects = await getProjects({ orderBy: 'asc' })
	const serialized_projects = projects.map(project_item => ({
		...project_item,
		created_at: project_item.created_at ? project_item.created_at.toISOString() : null,
		updated_at: project_item.updated_at ? project_item.updated_at.toISOString() : null
	})) satisfies Array<IProjectSerializedProjectItem>

	const sessions = await Promise.all(
		projects.map(async project_item => {
			const session_rows = await env.db
				.select({ session })
				.from(project_session)
				.innerJoin(session, eq(project_session.session_id, session.id))
				.where(eq(project_session.project_id, project_item.id))
				.orderBy(desc(project_session.created_at))
				.limit(10)

			return [
				project_item.id,
				session_rows.map(item =>
					serializeSessionItem({ session_item: item.session, project_id: project_item.id })
				)
			] as const
		})
	)

	const todos = await Promise.all(
		projects.map(async project_item => {
			const todo_rows = await env.db
				.select({ todo })
				.from(project_todo)
				.innerJoin(todo, eq(project_todo.todo_id, todo.id))
				.where(eq(project_todo.project_id, project_item.id))
				.orderBy(desc(project_todo.created_at))

			return [
				project_item.id,
				todo_rows.map(item => serializeTodoItem({ todo_item: item.todo, project_id: project_item.id }))
			] as const
		})
	)

	const file_trees = await Promise.all(
		projects.map(async project_item => {
			return [project_item.id, await readProjectTree(project_item.dir)] as const
		})
	)

	const file_contents = {} as Record<string, string>

	for (const project_item of projects) {
		const tree_items = file_trees.find(item => item[0] === project_item.id)?.[1] || []
		const file_item = tree_items.find(item => item.file_type === 'file')

		if (file_item) {
			file_contents[file_item.dir] = await readProjectFile(project_item.dir, file_item.dir)
		}
	}

	return {
		projects: serialized_projects,
		sessions: Object.fromEntries(sessions),
		todos: Object.fromEntries(todos),
		file_trees: Object.fromEntries(file_trees),
		file_contents,
		selected_project_id: projects[0]?.id || '',
		selected_session_id: sessions[0]?.[1][0]?.id || '',
		selected_file_path: Object.keys(file_contents)[0] || '',
		has_more_map: Object.fromEntries(
			sessions.map(([project_id, session_list]) => [project_id, session_list.length >= 10])
		)
	} satisfies IProjectListData
})
