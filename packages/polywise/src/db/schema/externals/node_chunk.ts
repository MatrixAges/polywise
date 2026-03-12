import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import chunk from '../chunk'
import node from '../node'

export default sqliteTable(
	'node_chunk',
	{
		// 谁（哪个节点）
		node_id: text('node_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),

		// 在哪（哪个文本块里）
		chunk_id: text('chunk_id')
			.references(() => chunk.id, { onDelete: 'cascade' })
			.notNull(),

		created_at: integer('created_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.notNull()
	},
	t => [
		// 复合主键：确保同一个节点在同一个 Chunk 里只会被记录一次
		primaryKey({ columns: [t.node_id, t.chunk_id] }),
		// 支持反向查找的索引：一个 chunk 被哪些 node 引用
		index('node_chunk_chunk_id_idx').on(t.chunk_id)
	]
)
