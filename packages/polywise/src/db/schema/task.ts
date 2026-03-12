import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable('task', {
	id: text('id').primaryKey().$defaultFn(getId),
	type: text('type').notNull(),
	progress: text('progress').notNull(),
	status: text('status').default('pending'),
	created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})
