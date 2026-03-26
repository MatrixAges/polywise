import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import article from '../article'
import session from '../session'

export default sqliteTable(
	'session_sop',
	{
		session_id: text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),

		article_id: text('article_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.session_id, t.article_id] }), index('session_sop_article_id_idx').on(t.article_id)]
)
