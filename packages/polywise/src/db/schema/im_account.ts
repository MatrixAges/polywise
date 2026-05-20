import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export default sqliteTable(
	'im_account',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		platform: text('platform').notNull(),
		account_id: text('account_id').notNull(),
		label: text('label'),
		enabled: integer('enabled', { mode: 'boolean' }).default(true).notNull(),
		config_json: text('config_json'),
		status: text('status').default('idle').notNull(),
		last_error: text('last_error'),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		uniqueIndex('im_account_platform_account_idx').on(t.platform, t.account_id),
		index('im_account_enabled_idx').on(t.enabled),
		index('im_account_status_idx').on(t.status)
	]
)
