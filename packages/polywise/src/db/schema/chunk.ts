import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import article from './article'

export default sqliteTable(
	'chunk',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// Foreign key: belongs to which article
		article_id: text('article_id').references(() => article.id, { onDelete: 'cascade' }),
		// Chunk content
		content: text('content'),
		// Keywords extracted from chunk content, used for full-text search
		keywords: text('keywords').notNull(),
		// The article has only one chunk
		is_body: integer('is_body', { mode: 'boolean' }).default(false).notNull(),
		// Chunk position in article
		position: integer('position'),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [index('chunk_article_id_idx').on(t.article_id)]
)
