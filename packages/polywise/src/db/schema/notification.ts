import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'notification',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		title: text('title').notNull(),
		description: text('description'),
		is_read: integer('is_read', { mode: 'boolean' }).default(false).notNull(),
		is_pushed: integer('is_pushed', { mode: 'boolean' }).default(false).notNull(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('notification_is_read_idx').on(t.is_read),
		index('notification_is_pushed_idx').on(t.is_pushed),
		index('notification_created_at_idx').on(t.created_at),
		index('notification_updated_at_idx').on(t.updated_at)
	]
)
