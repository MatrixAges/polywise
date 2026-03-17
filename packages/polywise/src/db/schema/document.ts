import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'document',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// 文档标题
		title: text('title').notNull(),
		// 文档描述（可选）
		description: text('description'),
		// 是否已生成三元组
		is_tripled: integer('is_tripled', { mode: 'boolean' }).default(false).notNull(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [index('document_is_tripled_idx').on(t.is_tripled)]
)
