import { text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { getId } from 'stk/utils'

import { SYS } from './base'
import { Status } from './objects'

export default SYS.table('task', {
	id: uuid('id').primaryKey().$defaultFn(getId),
	type: text('type').notNull(),
	progress: text('progress').notNull(),
	status: Status('status').default('pending'),
	created_at: timestamp('created_at').defaultNow(),
	updated_at: timestamp('updated_at')
		.defaultNow()
		.$onUpdateFn(() => new Date())
})
