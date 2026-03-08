import { sql } from 'drizzle-orm'
import { index, integer, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core'
import { getId } from 'stk/utils'

import article from './article'
import { MEM } from './metadata'

export default MEM.table(
	'chunk',
	{
		id: uuid('id').primaryKey().$defaultFn(getId),
		article_id: text('article_id').references(() => article.id, { onDelete: 'cascade' }),
		content: text('content'),
		vectors: vector('vectors', { dimensions: 1024 }),
		position: integer('position'),
		created_at: timestamp('created_at').defaultNow()
	},
	t => [
		index('chunk_vectors_index').using('hnsw', t.vectors.op('vector_cosine_ops')),
		index('chunk_content_index').using('gin', sql`to_tsvector('english', ${t.content})`)
	]
)
