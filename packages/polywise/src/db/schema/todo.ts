import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'todo',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// Todo title
		title: text('title').notNull(),
		// Todo description
		description: text('description'),
		// Todo priority: urgent, high, medium, low, none
		priority: text('priority').default('none'),
		// Todo status: draft, pending, processing, unreview, done, error, archive
		status: text('status').default('draft').notNull(),
		// Task result when completed
		result: text('result'),
		// Error message when task fails
		error: text('error'),
		// Sort order (float for fine-grained reordering)
		order: real('order').notNull(),
		// Estimated duration time: done_time - create_at
		estimate: integer('estimate'),
		// Due date
		due_at: integer('due_at', { mode: 'timestamp' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('todo_status_idx').on(t.status),
		index('todo_priority_idx').on(t.priority),
		index('todo_order_idx').on(t.order),
		index('todo_created_at_idx').on(t.created_at),
		index('todo_updated_at_idx').on(t.updated_at)
	]
)
