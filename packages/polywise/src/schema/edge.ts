import { index, integer, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { getId } from 'stk/utils'

import { MEM } from './metadata'
import node from './node'

export default MEM.table(
	'edge',
	{
		id: uuid('id').primaryKey().$defaultFn(getId),

		source_id: uuid('source_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),
		target_id: uuid('target_id')
			.references(() => node.id, { onDelete: 'cascade' })
			.notNull(),

		active_times: integer('active_times').default(1).notNull(),
		active_at: timestamp('active_at').defaultNow().notNull(),

		created_at: timestamp('created_at').defaultNow().notNull()
	},
	t => [
		uniqueIndex('edge_source_target_idx').on(t.source_id, t.target_id),
		index('edge_source_idx').on(t.source_id),
		index('edge_target_idx').on(t.target_id)
	]
)
