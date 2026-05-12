import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import agent from './agent'
import group from './group'

export default sqliteTable(
	'group_todo',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		group_id: text('group_id')
			.notNull()
			.references(() => group.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description'),
		priority: text('priority').default('none'),
		status: text('status').default('backlog').notNull(),
		result: text('result'),
		error: text('error'),
		order: real('order').notNull(),
		assignee_agent_id: text('assignee_agent_id').references(() => agent.id, { onDelete: 'set null' }),
		started_by_agent_id: text('started_by_agent_id').references(() => agent.id, { onDelete: 'set null' }),
		completed_by_agent_id: text('completed_by_agent_id').references(() => agent.id, { onDelete: 'set null' }),
		started_at: integer('started_at', { mode: 'timestamp' }),
		finished_at: integer('finished_at', { mode: 'timestamp' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('group_todo_group_idx').on(t.group_id),
		index('group_todo_status_idx').on(t.status),
		index('group_todo_order_idx').on(t.order),
		index('group_todo_assignee_idx').on(t.assignee_agent_id),
		index('group_todo_updated_at_idx').on(t.updated_at)
	]
)
