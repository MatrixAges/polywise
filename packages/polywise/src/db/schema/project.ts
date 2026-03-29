import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import type { TableModel } from '@core/types'

export default sqliteTable(
	'project',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		name: text('name').notNull(),
		desc: text('desc'),
		dir: text('dir').notNull(),
		model: text('model', { mode: 'json' }).$type<TableModel>(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('project_name_idx').on(t.name),
		index('project_created_at_idx').on(t.created_at),
		index('project_updated_at_idx').on(t.updated_at)
	]
)
