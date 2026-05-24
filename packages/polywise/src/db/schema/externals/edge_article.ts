import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import article from '../article'
import edge from '../edge'

export default sqliteTable(
	'edge_article',
	{
		edge_id: text('edge_id')
			.notNull()
			.references(() => edge.id, { onDelete: 'cascade' }),
		article_id: text('article_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.edge_id, t.article_id] }), index('edge_article_article_id_idx').on(t.article_id)]
)
