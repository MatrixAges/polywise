import { index, integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import agent from './agent'

export default sqliteTable(
	'node',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		agent_id: text('agent_id')
			.references(() => agent.id, { onDelete: 'cascade' })
			.notNull(),
		// 实体名称
		name: text('name').notNull(),
		// 当前激活电位 (用于模拟能量扩散/扩展激活)
		active_level: real('active_level').default(0.0).notNull(),
		// 激活敏感度 (决定被激活的难易程度)
		active_sens: real('active_sens').default(0.0).notNull(),
		// 被访问的总次数
		active_times: integer('active_times').default(1).notNull(),
		// 最后一次被用于推理/漫游的时间 (用于长时程抑制)
		active_at: integer('active_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull(),
		// 冻结状态 (核心记忆节点，免受遗忘机制清理)
		is_frozen: integer('is_frozen', { mode: 'boolean' }).default(false).notNull(),

		created_at: integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull()
	},
	t => [unique('node_agent_name_unique').on(t.agent_id, t.name), index('node_agent_id_idx').on(t.agent_id)]
)
