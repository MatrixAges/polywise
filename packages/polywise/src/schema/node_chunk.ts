import { index, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'

import chunk from './chunk'
import { MEM } from './metadata'
import node from './node'

export default MEM.table(
	'node_chunk',
	{
		// 谁（哪个节点）
		node_id: uuid('node_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),
		// 在哪（哪个文本块里）
		chunk_id: uuid('chunk_id')
			.references(() => chunk.id, { onDelete: 'cascade' })
			.notNull(),

		created_at: timestamp('created_at').defaultNow().notNull()
	},
	t => [
		// 复合主键：确保同一个节点在同一个 Chunk 里只会被记录一次
		primaryKey({ columns: [t.node_id, t.chunk_id] }),
		// 两个方向的索引：保证极速的双向查找
		index('node_chunk_node_id_idx').on(t.node_id),
		index('node_chunk_chunk_id_idx').on(t.chunk_id)
	]
)
