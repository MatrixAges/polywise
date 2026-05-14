import { blob, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'link',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		hash: text('hash'),
		url: text('url').notNull(),
		title: text('title').notNull(),
		favicon: blob('favicon'),
		status: text('status', { enum: ['none', 'pending', 'success', 'fail', 'timeout', 'ignore'] })
			.default('none')
			.notNull(),
		// when generate
		generate_at: integer('generate_at', { mode: 'timestamp' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		uniqueIndex('link_hash_idx').on(t.hash),
		index('link_status_idx').on(t.status),
		index('link_generate_at_idx').on(t.generate_at),
		index('link_created_at_idx').on(t.created_at),
		index('link_updated_at_idx').on(t.updated_at)
	]
)
