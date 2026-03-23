import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import agent from '../agent'
import article from '../article'

export default sqliteTable(
	'agent_article',
	{
		// Associate with agent table, set cascade delete: automatically delete this association record when Agent is deleted
		agent_id: text('agent_id')
			.notNull()
			.references(() => agent.id, { onDelete: 'cascade' }),

		// Associate with article table, set cascade delete: automatically delete this association record when article is deleted
		article_id: text('article_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [
		// Set combination of both as primary key, prevent same Agent from repeatedly associating same article
		primaryKey({ columns: [t.agent_id, t.article_id] }),
		// Index supporting reverse lookup: which agents reference an article
		index('agent_article_article_id_idx').on(t.article_id)
	]
)
