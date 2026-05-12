import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import group from '../group'

export default sqliteTable(
	'group_folder',
	{
		group_id: text('group_id')
			.notNull()
			.references(() => group.id, { onDelete: 'cascade' }),
		path: text('path').notNull(),
		order: real('order').notNull(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [
		primaryKey({ columns: [t.group_id, t.path] }),
		index('group_folder_group_idx').on(t.group_id),
		index('group_folder_order_idx').on(t.order)
	]
)
