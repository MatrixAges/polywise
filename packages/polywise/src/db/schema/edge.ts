import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import agent from './agent'
import node from './node'

export default sqliteTable(
	'edge',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// 记录三元组中的 "谓词/关系"
		relation: text('relation').notNull(),
		// 外键：属于哪个智能体
		agent_id: text('agent_id')
			.references(() => agent.id, { onDelete: 'cascade' })
			.notNull(),
		// 外键：来源哪个节点
		source_id: text('source_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),
		// 外键：指向哪个节点
		target_id: text('target_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),
		// 突触权重：RL 中的 Q-value (决定信号传递强度)
		weight: real('weight').default(1.0).notNull(),
		// 神经可塑性：学习率 (这个值越高，weight 改变越快；可用于冻结成熟记忆)
		growth: real('growth').default(1.0).notNull(),
		// 置信度 (RL 探索 vs 利用的依据：低置信度促使网络探索新路径)
		confidence: real('confidence').default(0.5).notNull(),
		// 起始节点到目标节点的距离
		distance: real('distance').default(1.0).notNull(),
		// 边的粗细，决定信号传播速度
		bandwidth: real('bandwidth').default(1.0).notNull(),
		// 被访问的总次数
		active_times: integer('active_times').default(1).notNull(),
		// 最后一次被用于推理/漫游的时间 (用于突触修剪/长时程抑制)
		active_at: integer('active_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull(),
		// 冻结状态 (核心记忆节点，免受遗忘机制清理)
		is_frozen: integer('is_frozen', { mode: 'boolean' }).default(false).notNull(),

		created_at: integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull()
	},
	t => [
		index('edge_agent_id_idx').on(t.agent_id),
		index('edge_source_idx').on(t.source_id),
		index('edge_target_idx').on(t.target_id),
		uniqueIndex('edge_source_target_idx').on(t.source_id, t.target_id)
	]
)
