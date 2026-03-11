import { index, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'

import agent from '../agent'
import { SYS } from '../base'
import document from '../document'

export default SYS.table(
	'agent_document',
	{
		// 关联 agent 表，设置级联删除：删除 Agent 时自动删除此关联记录
		agent_id: uuid('agent_id')
			.notNull()
			.references(() => agent.id, { onDelete: 'cascade' }),

		// 关联 document 表，设置级联删除：删除文章时自动删除此关联记录
		document_id: uuid('document_id')
			.notNull()
			.references(() => document.id, { onDelete: 'cascade' }),

		created_at: timestamp('created_at').defaultNow()
	},
	t => [
		// 将两者的组合设置为主键，防止同一个 Agent 重复关联同一个文档
		primaryKey({ columns: [t.agent_id, t.document_id] }),
		// 支持反向查找的索引：某个文档被哪些 agent 引用
		index('agent_document_document_id_idx').on(t.document_id)
	]
)
