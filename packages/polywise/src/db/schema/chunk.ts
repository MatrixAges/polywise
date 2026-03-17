import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import article from './article'

export default sqliteTable(
	'chunk',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// 外键：属于那一篇文章
		article_id: text('article_id').references(() => article.id, { onDelete: 'cascade' }),
		// 切片内容
		content: text('content'),
		// 从切片内容中提取到的关键词，用于全文检索
		keywords: text('keywords').notNull(),
		// 所属文章只有一个 chunk
		is_body: integer('is_body', { mode: 'boolean' }).default(false).notNull(),
		// 切片在文章中位置
		position: integer('position'),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [index('chunk_article_id_idx').on(t.article_id)]
)
