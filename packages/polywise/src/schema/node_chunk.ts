import { index, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'

import chunk from './chunk'
import { MEM } from './metadata'
import node from './node'

export default MEM.table(
	'node_chunk',
	{
		node_id: uuid('node_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),

		chunk_id: uuid('chunk_id')
			.references(() => chunk.id, { onDelete: 'cascade' })
			.notNull(),

		created_at: timestamp('created_at').defaultNow().notNull()
	},
	t => [
		primaryKey({ columns: [t.node_id, t.chunk_id] }),
		index('node_chunk_node_idx').on(t.node_id),
		index('node_chunk_chunk_idx').on(t.chunk_id)
	]
)
