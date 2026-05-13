import { blob, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'group',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		name: text('name').notNull(),
		description: text('description'),
		photo: blob('photo'),
		folders: text('folders', { mode: 'json' }).$type<Array<{ name: string; path: string }>>(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [index('group_name_idx').on(t.name), index('group_updated_at_idx').on(t.updated_at)]
)
