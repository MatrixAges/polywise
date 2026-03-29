import { index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import todo from '../todo'

export default sqliteTable(
	'todo_tag',
	{
		todo_id: text('todo_id')
			.notNull()
			.references(() => todo.id, { onDelete: 'cascade' }),
		tag: text('tag').notNull()
	},
	t => [primaryKey({ columns: [t.todo_id, t.tag] }), index('todo_tag_tag_idx').on(t.tag)]
)
