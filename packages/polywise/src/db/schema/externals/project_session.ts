import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import project from '../project'
import session from '../session'

export default sqliteTable(
	'project_session',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		project_id: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		session_id: text('session_id')
			.notNull()
			.references(() => session.id, { onDelete: 'cascade' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [
		index('project_session_project_id_idx').on(t.project_id),
		index('project_session_session_id_idx').on(t.session_id)
	]
)
