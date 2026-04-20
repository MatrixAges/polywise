import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

import document from './document'

export default sqliteTable(
	'article',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		// Foreign key: belongs to which document (optional)
		document_id: text('document_id').references(() => document.id, { onDelete: 'cascade' }),
		// Article content
		content: text('content').notNull(),
		// Article title (optional)
		title: text('title'),
		path: text('path'),
		for: text('for', { enum: ['linkcase', 'wiki', 'memory', 'user'] }).notNull(),
		// Scope ownership: global / project / agent
		scope_type: text('scope_type', { enum: ['global', 'project', 'agent'] }).default('global'),
		// Scope owner id (project.id or agent.id), null for global
		scope_id: text('scope_id'),
		// Data origin: agent (main agent) / superego (superego agent)
		source: text('source', { enum: ['agent', 'superego'] }).default('agent'),
		// Content hash value, used for duplicate content verification
		hash: text('hash'),
		// Article metadata (for filtering)
		metadata: text('metadata', { mode: 'json' }).default({}),
		// Long article (content exceeds 12000 characters)
		is_long: integer('is_long', { mode: 'boolean' }).generatedAlwaysAs(sql`length(content) > 12000`),
		// Whether triples have been generated
		is_tripled: integer('is_tripled', { mode: 'boolean' }).default(false).notNull(),
		created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
		updated_at: integer('updated_at', { mode: 'timestamp' })
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	t => [
		index('article_document_id_idx').on(t.document_id),
		index('article_for_idx').on(t.for),
		index('article_scope_idx').on(t.scope_type, t.scope_id),
		index('article_source_idx').on(t.source),
		index('article_is_tripled_idx').on(t.is_tripled),
		index('article_created_at_idx').on(t.created_at),
		index('article_updated_at_idx').on(t.updated_at),
		uniqueIndex('article_hash_idx').on(t.hash)
	]
)
