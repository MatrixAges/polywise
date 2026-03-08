import { jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { getId } from 'stk/utils'

import { MEM } from './metadata'

export default MEM.table('article', {
	id: uuid('id').primaryKey().$defaultFn(getId),
	content: text('content').notNull(),
	title: text('title'),
	url: text('url'),
	metadata: jsonb('metadata').default({}),
	created_at: timestamp('created_at').defaultNow(),
	updated_at: timestamp('updated_at')
		.defaultNow()
		.$onUpdateFn(() => new Date())
})
