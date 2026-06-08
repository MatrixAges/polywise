import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'

export const chunk_vec = sqliteTable('chunk_vec', {
	rowid: integer('rowid').primaryKey()
})

export const agent_vec = sqliteTable('agent_vec', {
	rowid: integer('rowid').primaryKey()
})
