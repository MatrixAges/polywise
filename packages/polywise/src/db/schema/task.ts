import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'task',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// Task classification (each category is independently executed when consuming tasks): triple (article triple generation), link (generate article from link)
		type: text('type').notNull(),
		// Arguments passed to the execution function
		args: text('args', { mode: 'json' }).$type<Record<string, any>>().notNull(),
		// Task status: pending (queued), running (executing), success (execution succeeded), fail (execution failed), awaiting (needs confirmation), ignore (ignored), timeout (timed out), cancel (cancelled)
		status: text('status').default('pending'),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('task_type_idx').on(t.type),
		index('task_status_idx').on(t.status),
		index('task_created_at_idx').on(t.created_at),
		index('task_updated_at_idx').on(t.updated_at)
	]
)
