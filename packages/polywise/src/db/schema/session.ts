import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import type { TableModel } from '@core/types'

export default sqliteTable('session', {
	id: text('id').primaryKey().$defaultFn(getId),
	// session title
	title: text('title').notNull(),
	// Model
	model: text('model', { mode: 'json' }).$type<TableModel>().notNull(),
	// session runing status
	is_runing: integer('runing', { mode: 'boolean' }).default(false).notNull(),
	created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})
