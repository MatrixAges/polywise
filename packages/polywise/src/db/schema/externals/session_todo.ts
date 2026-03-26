import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import session from '../session'
import todo from '../todo'

export default sqliteTable(
	'session_todo',
	{
		session_id: text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),

		todo_id: text('todo_id')
			.notNull()
			.references(() => todo.id, { onDelete: 'cascade' }),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.session_id, t.todo_id] }), index('session_todo_todo_id_idx').on(t.todo_id)]
)
