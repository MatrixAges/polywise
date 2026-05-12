import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import agent from '../agent'
import group from '../group'

export default sqliteTable(
	'group_agent',
	{
		group_id: text('group_id')
			.notNull()
			.references(() => group.id, { onDelete: 'cascade' }),
		agent_id: text('agent_id')
			.notNull()
			.references(() => agent.id, { onDelete: 'cascade' }),
		order: real('order').notNull(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [
		primaryKey({ columns: [t.group_id, t.agent_id] }),
		index('group_agent_group_idx').on(t.group_id),
		index('group_agent_agent_idx').on(t.agent_id)
	]
)
