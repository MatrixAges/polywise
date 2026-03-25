import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import agent from '../agent'
import session from '../session'

export default sqliteTable(
	'session_agent',
	{
		session_id: text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),

		agent_id: text('agent_id')
			.notNull()
			.references(() => agent.id, { onDelete: 'cascade' }),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.session_id, t.agent_id] }), index('session_agent_agent_idx').on(t.agent_id)]
)
