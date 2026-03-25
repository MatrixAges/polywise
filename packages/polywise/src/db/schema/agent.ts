import { blob, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export interface AgentProvider {
	provider: string
	model: string
	effort?: string
	options?: any
}

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
	// Model provider
	provider: text('provider', { mode: 'json' }).$type<AgentProvider>(),

	created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})
