import { index, integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import agent from './agent'

export default sqliteTable(
	'node',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		agent_id: text('agent_id')
			.references(() => agent.id, { onDelete: 'cascade' })
			.notNull(),
		// Entity name
		name: text('name').notNull(),
		// Current activation potential (for simulating energy diffusion/spreading activation)
		active_level: real('active_level').default(0.0).notNull(),
		// Activation sensitivity (determines ease of activation)
		active_sens: real('active_sens').default(0.0).notNull(),
		// Total number of times visited
		active_times: integer('active_times').default(1).notNull(),
		// Last time used for reasoning/wandering (for long-term depression)
		active_at: integer('active_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull(),
		// Frozen state (core memory nodes, exempt from forgetting mechanism cleanup)
		is_frozen: integer('is_frozen', { mode: 'boolean' }).default(false).notNull(),

		created_at: integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull()
	},
	t => [unique('node_agent_name_unique').on(t.agent_id, t.name), index('node_agent_id_idx').on(t.agent_id)]
)
