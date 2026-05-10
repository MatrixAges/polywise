import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'file',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		path: text('path').notNull(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('file_path_idx').on(t.path),
		index('file_created_at_idx').on(t.created_at),
		index('file_updated_at_idx').on(t.updated_at)
	]
)
