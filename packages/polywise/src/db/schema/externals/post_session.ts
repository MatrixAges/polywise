import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import article from '../article'
import session from '../session'

export default sqliteTable(
	'post_session',
	{
		post_id: text('post_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),
		session_id: text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [
		uniqueIndex('post_session_post_id_idx').on(t.post_id),
		uniqueIndex('post_session_session_id_idx').on(t.session_id),
		index('post_session_created_at_idx').on(t.created_at)
	]
)
