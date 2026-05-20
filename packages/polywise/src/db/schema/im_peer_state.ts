import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'im_peer_state',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		platform: text('platform').notNull(),
		account_id: text('account_id').notNull(),
		peer_key: text('peer_key').notNull(),
		state_json: text('state_json'),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		uniqueIndex('im_peer_state_platform_account_peer_idx').on(t.platform, t.account_id, t.peer_key),
		index('im_peer_state_platform_idx').on(t.platform),
		index('im_peer_state_account_idx').on(t.account_id)
	]
)
