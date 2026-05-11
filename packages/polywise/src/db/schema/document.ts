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
		path: text('path'),
		// Hit stats for rerank weighting
		hit_count: integer('hit_count'),
		hit_at: integer('hit_at', { mode: 'timestamp' }),
		// Whether the document save pipeline has finished
		is_pipelined: integer('is_pipelined', { mode: 'boolean' }).default(false).notNull(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('document_is_pipelined_idx').on(t.is_pipelined),
		index('document_created_at_idx').on(t.created_at),
		index('document_updated_at_idx').on(t.updated_at)
	]
)
