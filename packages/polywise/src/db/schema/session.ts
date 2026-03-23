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
	created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})
