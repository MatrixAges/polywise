import { bytea, text, timestamp, uuid, varchar, vector } from 'drizzle-orm/pg-core'
import { getId } from 'stk/utils'

import { SYS } from './base'

export default SYS.table('agent', {
	id: uuid('id').primaryKey().$defaultFn(getId),
	// 智能体名称
	name: varchar('name', { length: 255 }).notNull(),
	// 智能体描述
	description: varchar('description', { length: 500 }),
	// 智能体头像
	avatar: bytea('avatar'),
	// 系统提示词
	prompt: text('prompt').notNull().default('You are a personal agent assistant.'),
	// 智能体人格
	soul: text('soul').notNull().default(''),
	// 核心记忆
	memory: text('memory').default(''),
	// description + prompt + soul + memory 生成的向量，用于根据用户输入路由到子 agent
	vectors: vector('vectors', { dimensions: 1024 }),
	created_at: timestamp('created_at').defaultNow(),
	updated_at: timestamp('updated_at')
		.defaultNow()
		.$onUpdateFn(() => new Date())
})
