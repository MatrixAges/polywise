import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import session from '../session'
import todo from '../todo'

export default sqliteTable(
	'todo_session',
	{
		todo_id: text('todo_id')
			.notNull()
			.references(() => todo.id, { onDelete: 'cascade' }),

		session_id: text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.todo_id, t.session_id] }), index('todo_session_session_id_idx').on(t.session_id)]
)
