import { index, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'

import { MEM } from '../base'
import chunk from '../chunk'
import node from '../node'

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
		// 支持反向查找的索引：一个 chunk 被哪些 node 引用
		index('node_chunk_chunk_id_idx').on(t.chunk_id)
	]
)
