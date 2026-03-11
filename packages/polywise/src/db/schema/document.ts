import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { getId } from 'stk/utils'

import { MEM } from './base'

export default MEM.table('document', {
	id: uuid('id').primaryKey().$defaultFn(getId),
	// 文档标题
	title: varchar('title', { length: 100 }).notNull(),
	// 文档描述（可选）
	description: varchar('description', { length: 600 }),
	created_at: timestamp('created_at').defaultNow(),
	updated_at: timestamp('updated_at')
		.defaultNow()
		.$onUpdateFn(() => new Date())
})
