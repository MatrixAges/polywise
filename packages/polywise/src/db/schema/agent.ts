import { blob, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable('agent', {
	id: text('id').primaryKey().$defaultFn(getId),
	// 智能体名称
	name: text('name').notNull(),
	// 智能体描述
	description: text('description'),
	// 智能体头像
	avatar: blob('avatar'),
	// 系统提示词
	prompt: text('prompt'),
	// 智能体人格
	soul: text('soul').notNull().default(''),
	// 核心记忆
	memory: text('memory').default(''),
	created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})
