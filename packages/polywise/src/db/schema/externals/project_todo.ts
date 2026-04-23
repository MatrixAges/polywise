import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import project from '../project'
import todo from '../todo'

export default sqliteTable(
	'project_todo',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		project_id: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		todo_id: text('todo_id')
			.notNull()
			.references(() => todo.id, { onDelete: 'cascade' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [index('project_todo_project_id_idx').on(t.project_id), index('project_todo_todo_id_idx').on(t.todo_id)]
)
