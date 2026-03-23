import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'document',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// Document title
		title: text('title').notNull(),
		// Document description (optional)
		description: text('description'),
		// Whether triples have been generated
		is_tripled: integer('is_tripled', { mode: 'boolean' }).default(false).notNull(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [index('document_is_tripled_idx').on(t.is_tripled)]
)
