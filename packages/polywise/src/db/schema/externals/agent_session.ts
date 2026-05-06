import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import agent from '../agent'
import session from '../session'

export default sqliteTable(
	'agent_session',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		agent_id: text('agent_id')
			.notNull()
			.references(() => agent.id, { onDelete: 'cascade' }),
		session_id: text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [
		index('agent_session_agent_id_idx').on(t.agent_id),
		index('agent_session_session_id_idx').on(t.session_id),
		uniqueIndex('agent_session_agent_session_idx').on(t.agent_id, t.session_id)
	]
)
