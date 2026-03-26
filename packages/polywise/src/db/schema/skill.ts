import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'skill',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// skill name
		name: text('name').notNull(),
		// skill description
		desc: text('desc').notNull(),
		//  skill path in the file system
		path: text('path').notNull(),
		// skill type
		type: text('type'),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('skill_type_idx').on(t.type),
		index('skill_created_at_idx').on(t.created_at),
		index('skill_updated_at_idx').on(t.updated_at)
	]
)
