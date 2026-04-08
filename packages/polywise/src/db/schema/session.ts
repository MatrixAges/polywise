import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'session',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// session title
		title: text('title').notNull(),
		// session runing status
		is_runing: integer('runing', { mode: 'boolean' }).default(false).notNull(),
		// binding session for im
		key: text('key'),
		// is im chat session
		is_im: integer('im', { mode: 'boolean' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('session_is_im_idx').on(t.is_im),
		index('session_created_at_idx').on(t.created_at),
		index('session_updated_at_idx').on(t.updated_at),
		uniqueIndex('session_key_idx').on(t.key)
	]
)
