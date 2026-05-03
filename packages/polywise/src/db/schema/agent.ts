import { blob, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import type { TableModel } from '@core/types'

export default sqliteTable(
	'agent',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// Agent name
		name: text('name').notNull(),
		// Agent description
		description: text('description'),
		// Agent photo: image file, photo take over avatar
		photo: blob('photo'),
		// Agent avatar: generate by program
		avatar: text('avatar', { mode: 'json' }).$type<any>(),
		// How you run
		prompt: text('prompt'),
		// What's in your mind
		soul: text('soul'),
		// Who you are
		identity: text('identity'),
		// Core memory
		memory: text('memory').default(''),
		// Model provider
		model: text('model', { mode: 'json' }).$type<TableModel>().notNull(),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [index('agent_created_at_idx').on(t.created_at), index('agent_updated_at_idx').on(t.updated_at)]
)
