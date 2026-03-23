import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable('session', {
	id: text('id').primaryKey().$defaultFn(getId),
	// session title
	title: text('title').notNull(),
	// llm provider id
	provider: text('provider').notNull(),
	// provider model id
	model: text('model').notNull(),
	// reasoning effort
	effort: text('effort'),
	// provider
	options: text('options', { mode: 'json' }),
	// session runing status
	is_runing: integer('runing', { mode: 'boolean' }).default(false).notNull(),
	created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})
