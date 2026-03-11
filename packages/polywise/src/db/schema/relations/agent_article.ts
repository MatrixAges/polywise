import { index, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'

import agent from '../agent'
import article from '../article'
import { SYS } from '../base'

export default SYS.table(
	'agent_article',
	{
		// 关联 agent 表，设置级联删除：删除 Agent 时自动删除此关联记录
		agent_id: uuid('agent_id')
			.notNull()
			.references(() => agent.id, { onDelete: 'cascade' }),

		// 关联 article 表，设置级联删除：删除文章时自动删除此关联记录
		article_id: uuid('article_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),

		created_at: timestamp('created_at').defaultNow()
	},
	t => [
		// 将两者的组合设置为主键，防止同一个 Agent 重复关联同一篇文章
		primaryKey({ columns: [t.agent_id, t.article_id] }),
		// 支持反向查找的索引：一篇文章被哪些 agent 引用
		index('agent_article_article_id_idx').on(t.article_id)
	]
)
