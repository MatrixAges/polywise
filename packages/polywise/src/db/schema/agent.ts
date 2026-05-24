import { blob, index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import type { TableModel } from '@core/types'

export default sqliteTable(
	'agent',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// Agent name
		name: text('name').notNull(),
		// Agent role
		role: text('role').notNull(),
		// Agent description
		description: text('description'),
		// Agent photo: image file, photo take over avatar
		photo: blob('photo'),
		// Agent avatar: generate by program
		avatar: text('avatar', { mode: 'json' }).$type<any>(),
		// Enabled custom tools for this agent
		tools: text('tools', { mode: 'json' }).$type<Array<string>>().default([]).notNull(),
		// How agent run
		prompt: text('prompt'),
		// What's in agent's mind
		soul: text('soul'),
		// Who agent is
		identity: text('identity'),
		// Core memory
		memory: text('memory').default(''),
		// Frozen agents keep imported behavior and graph state immutable.
		is_frozen: integer('is_frozen', { mode: 'boolean' }).default(false).notNull(),
		// Sort order for drag reordering
		order: real('order').notNull(),
		// Model provider
		model: text('model', { mode: 'json' }).$type<TableModel>().notNull(),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('agent_order_idx').on(t.order),
		index('agent_created_at_idx').on(t.created_at),
		index('agent_updated_at_idx').on(t.updated_at)
	]
)
