import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import notification from '../notification'
import session from '../session'

export default sqliteTable(
	'notification_session',
	{
		notification_id: text('notification_id')
			.notNull()
			.references(() => notification.id, { onDelete: 'cascade' }),

		session_id: text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [
		primaryKey({ columns: [t.notification_id, t.session_id] }),
		index('notification_session_session_id_idx').on(t.session_id)
	]
)
