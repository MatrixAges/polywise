import { sql } from 'drizzle-orm'
import { boolean, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { getId } from 'stk/utils'

import { MEM } from './metadata'

export default MEM.table('article', {
	id: uuid('id').primaryKey().$defaultFn(getId),
	// 文章内容
	content: text('content').notNull(),
	// 文章标题（可选）
	title: text('title'),
	// 文章数据来源（可选）
	url: text('url'),
	// 文章元数据（用于筛选）
	metadata: jsonb('metadata').default({}),
	// 长文章（content 超过 12000个字符）
	long: boolean('long').generatedAlwaysAs(sql`char_length(content) > 12000`),
	created_at: timestamp('created_at').defaultNow(),
	updated_at: timestamp('updated_at')
		.defaultNow()
		.$onUpdateFn(() => new Date())
})
