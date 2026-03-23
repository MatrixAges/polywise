import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import agent from '../agent'
import skill from '../skill'

export default sqliteTable(
	'agent_skill',
	{
		agent_id: text('agent_id')
			.notNull()
			.references(() => agent.id, { onDelete: 'cascade' }),

		skill_id: text('skill_id')
			.notNull()
			.references(() => skill.id, { onDelete: 'cascade' }),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.agent_id, t.skill_id] }), index('agent_skill_id_idx').on(t.skill_id)]
)
