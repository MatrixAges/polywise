import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'

export const chunk_vec = sqliteTable('chunk_vec', {
	rowid: integer('rowid').primaryKey()
})

export const node_vec = sqliteTable('node_vec', {
	rowid: integer('rowid').primaryKey()
})

export const edge_vec = sqliteTable('edge_vec', {
	rowid: integer('rowid').primaryKey()
})

export const agent_vec = sqliteTable('agent_vec', {
	rowid: integer('rowid').primaryKey()
})
