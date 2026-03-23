import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import chunk from '../chunk'
import node from '../node'

export default sqliteTable(
	'node_chunk',
	{
		// Who (which node)
		node_id: text('node_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),

		// Where (in which text chunk)
		chunk_id: text('chunk_id')
			.references(() => chunk.id, { onDelete: 'cascade' })
			.notNull(),

		created_at: integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull()
	},
	t => [
		// Composite primary key: ensures same node is recorded only once in same Chunk
		primaryKey({ columns: [t.node_id, t.chunk_id] }),
		// Index supporting reverse lookup: which nodes reference a chunk
		index('node_chunk_chunk_id_idx').on(t.chunk_id)
	]
)
