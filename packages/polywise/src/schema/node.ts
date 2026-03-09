import { boolean, index, integer, real, text, timestamp, unique, uuid, vector } from 'drizzle-orm/pg-core'
import { getId } from 'stk/utils'

import agent from './agent'
import { MEM } from './metadata'

export default MEM.table(
	'node',
	{
		id: uuid('id').primaryKey().$defaultFn(getId),
		agent_id: uuid('agent_id')
			.references(() => agent.id, { onDelete: 'cascade' })
			.notNull(),
		name: text('name').notNull(),
		vectors: vector('vectors', { dimensions: 1024 }),
		// 当前激活电位 (用于模拟能量扩散/扩展激活)
		active_level: real('active_level').default(0.0).notNull(),
		// 激活敏感度 (决定被激活的难易程度)
		active_sens: real('active_sens').default(0.0).notNull(),
		// 被访问的总次数
		active_times: integer('active_times').default(1).notNull(),
		// 最后一次被用于推理/漫游的时间 (用于长时程抑制)
		active_at: timestamp('active_at').defaultNow().notNull(),
		// 冻结状态 (核心记忆节点，免受遗忘机制清理)
		is_frozen: boolean('is_frozen').default(false).notNull(),

		created_at: timestamp('created_at').defaultNow().notNull()
	},
	t => [
		unique('node_agent_name_unique').on(t.agent_id, t.name),
		index('node_agent_id_idx').on(t.agent_id),
		index('node_vectors_idx').using('hnsw', t.vectors.op('vector_cosine_ops'))
	]
)
