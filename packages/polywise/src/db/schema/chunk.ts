import { sql } from 'drizzle-orm'
import { boolean, index, integer, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core'
import { getId } from 'stk/utils'

import article from './article'
import { MEM } from './base'

export default MEM.table(
	'chunk',
	{
		id: uuid('id').primaryKey().$defaultFn(getId),
		// 外键：属于那一篇文章
		article_id: uuid('article_id').references(() => article.id, { onDelete: 'cascade' }),
		// 切片内容
		content: text('content'),
		// 切片向量
		vectors: vector('vectors', { dimensions: 1024 }),
		// 从切片内容中提取到的关键词，用于全文检索
		keywords: text('keywords').notNull(),
		// 所属文章只有一个 chunk
		as_body: boolean('as_body').default(false),
		// 切片在文章中位置
		position: integer('position'),
		created_at: timestamp('created_at').defaultNow()
	},
	t => [
		index('chunk_article_id_idx').on(t.article_id),
		index('chunk_vectors_idx').using('hnsw', t.vectors.op('vector_cosine_ops')),
		index('chunk_keywords_idx').using('gin', sql`to_tsvector('simple', ${t.keywords})`)
	]
)
