import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import agent from './agent'
import node from './node'
import session from './session'

export default sqliteTable(
	'rewire_event',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		agent_id: text('agent_id').references(() => agent.id, { onDelete: 'cascade' }),
		session_id: text('session_id').references(() => session.id, { onDelete: 'set null' }),
		stimulus_key: text('stimulus_key').notNull(),
		signal: text('signal').notNull(),
		role: text('role').notNull(),
		node_id: text('node_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),
		strength: real('strength').default(1.0).notNull(),
		created_at: integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull()
	},
	t => [
		index('rewire_event_stimulus_idx').on(t.stimulus_key),
		index('rewire_event_session_idx').on(t.session_id),
		index('rewire_event_node_idx').on(t.node_id),
		index('rewire_event_created_at_idx').on(t.created_at)
	]
)
