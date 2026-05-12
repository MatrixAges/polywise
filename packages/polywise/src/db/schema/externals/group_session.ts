import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import group from '../group'
import session from '../session'

export default sqliteTable(
	'group_session',
	{
		group_id: text('group_id')
			.notNull()
			.references(() => group.id, { onDelete: 'cascade' }),
		session_id: text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [
		primaryKey({ columns: [t.group_id, t.session_id] }),
		index('group_session_group_idx').on(t.group_id),
		uniqueIndex('group_session_session_idx').on(t.session_id)
	]
)
