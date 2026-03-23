import { blob, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable('agent', {
	id: text('id').primaryKey().$defaultFn(getId),
	// Agent name
	name: text('name').notNull(),
	// Agent description
	description: text('description'),
	// Agent avatar
	avatar: blob('avatar'),
	// System prompt
	prompt: text('prompt'),
	// Agent personality
	soul: text('soul'),
	// Core memory
	memory: text('memory').default(''),
	created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})
