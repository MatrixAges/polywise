import { index, integer, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core'
import { getId } from 'stk/utils'

import { MEM } from './metadata'

export default MEM.table(
	'node',
	{
		id: uuid('id').primaryKey().$defaultFn(getId),
		name: text('name').notNull().unique(),
		vectors: vector('vectors', { dimensions: 1024 }),
		active_times: integer('active_times').default(1).notNull(),
		active_at: timestamp('active_at').defaultNow().notNull(),
		created_at: timestamp('created_at').defaultNow().notNull()
	},
	t => [index('node_vectors_idx').using('hnsw', t.vectors.op('vector_cosine_ops'))]
)
