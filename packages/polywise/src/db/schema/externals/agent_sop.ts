import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import agent from '../agent'
import article from '../article'

export default sqliteTable(
	'agent_sop',
	{
		agent_id: text('agent_id')
			.notNull()
			.references(() => agent.id, { onDelete: 'cascade' }),

		article_id: text('article_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.agent_id, t.article_id] }), index('agent_sop_article_id_idx').on(t.article_id)]
)
