import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import article from '../article'
import project from '../project'

export default sqliteTable(
	'post_project',
	{
		post_id: text('post_id')
			.notNull()
			.references(() => article.id, { onDelete: 'cascade' }),
		project_id: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [primaryKey({ columns: [t.post_id, t.project_id] }), index('post_project_project_id_idx').on(t.project_id)]
)
