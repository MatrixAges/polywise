import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import agent from '../agent'
import document from '../document'

export default sqliteTable(
	'agent_document',
	{
		// Associate with agent table, set cascade delete: automatically delete this association record when Agent is deleted
		agent_id: text('agent_id')
			.notNull()
			.references(() => agent.id, { onDelete: 'cascade' }),

		// Associate with document table, set cascade delete: automatically delete this association record when document is deleted
		document_id: text('document_id')
			.notNull()
			.references(() => document.id, { onDelete: 'cascade' }),

		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
	},
	t => [
		// Set combination of both as primary key, prevent same Agent from repeatedly associating same document
		primaryKey({ columns: [t.agent_id, t.document_id] }),
		// Index supporting reverse lookup: which agents reference a document
		index('agent_document_document_id_idx').on(t.document_id)
	]
)
