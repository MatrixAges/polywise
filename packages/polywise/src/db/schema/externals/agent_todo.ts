import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import agent from '../agent'
import todo from '../todo'

export default sqliteTable(
	'agent_todo',
	{
		agent_id: text('agent_id')
			.notNull()
			.references(() => agent.id, { onDelete: 'cascade' }),

		todo_id: text('todo_id')
			.notNull()
			.references(() => todo.id, { onDelete: 'cascade' }),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.agent_id, t.todo_id] }), index('agent_todo_todo_id_idx').on(t.todo_id)]
)
