import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import article from '../article'
import link from '../link'

export default sqliteTable(
	'link_article',
	{
		link_id: text('link_id')
			.notNull()
			.references(() => link.id, { onDelete: 'cascade' }),
		article_id: text('article_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.link_id, t.article_id] }), index('link_article_article_id_idx').on(t.article_id)]
)
