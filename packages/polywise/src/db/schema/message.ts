import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import session from './session'

export default sqliteTable(
	'message',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// Foreign key: belongs to which session
		session_id: text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),
		// message role
		role: text('role').notNull(),
		// ai sdk ui message
		content: text('content').notNull(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [index('message_session_id').on(t.session_id)]
)
