import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import article from '../article'

export default sqliteTable(
	'post_article',
	{
		post_id: text('post_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),
		article_id: text('article_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.post_id, t.article_id] }), index('post_article_article_id_idx').on(t.article_id)]
)
