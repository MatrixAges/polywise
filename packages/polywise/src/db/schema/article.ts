import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import document from './document'

export default sqliteTable(
	'article',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// 外键：属于那一个文档（可选）
		document_id: text('document_id').references(() => document.id, { onDelete: 'cascade' }),
		// 文章内容
		content: text('content').notNull(),
		// 文章标题（可选）
		title: text('title'),
		// 文章数据来源（可选）
		url: text('url'),
		// 内容哈希值，用来做相同内容验证
		hash: text('hash').unique(),
		// 文章元数据（用于筛选）
		metadata: text('metadata', { mode: 'json' }).default({}),
		// 长文章（content 超过 12000个字符）
		long: integer('long', { mode: 'boolean' }).generatedAlwaysAs(sql`length(content) > 12000`),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [index('article_document_id_idx').on(t.document_id)]
)
