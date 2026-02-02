import * as sql_schema from '../sql/schema'
import migrateFn from './migrate'
import validateMigrationsFn from './validateMigrations'

import type { Migration } from '../types'

export const CURRENT_SCHEMA_VERSION = 3

export const migrations: Migration[] = [
	{
		version: 1,
		description: 'Initial schema: brain nodes, edges, knowledge articles with idol_id, root_ids, metrics_ids',
		up: async exec => {
			await exec([
				sql_schema.sql_create_extension_vector,
				sql_schema.sql_create_schema_brain,
				sql_schema.sql_create_table_nodes,
				sql_schema.sql_create_table_edges,
				sql_schema.sql_create_index_edge_src,
				sql_schema.sql_create_index_edge_tgt,
				sql_schema.sql_create_index_active_edges,
				sql_schema.sql_create_index_core_truth,
				sql_schema.sql_create_index_nodes_idol,
				sql_schema.sql_create_index_edges_idol,
				sql_schema.sql_create_index_nodes_roots,
				sql_schema.sql_create_index_edges_roots,
				sql_schema.sql_create_schema_knowledge,
				sql_schema.sql_create_table_articles,
				sql_schema.sql_create_table_node_sources,
				sql_schema.sql_create_schema_user_space
			])
		}
	},
	{
		version: 2,
		description: 'Add article embeddings for vector search (using pgvector) and full-text search',
		up: async exec => {
			await exec([
				sql_schema.sql_create_table_article_embeddings,
				sql_schema.sql_create_index_article_embeddings_hnsw,
				sql_schema.sql_create_index_article_content_gin
			])
		}
	},
	{
		version: 3,
		description: 'Add metadata column to nodes and edges',
		up: async exec => {
			await exec([
				"ALTER TABLE brain.nodes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';",
				"ALTER TABLE brain.edges ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';"
			])
		}
	}
]

export async function migrate(
	current_version: number,
	exec: (sql: string | string[]) => Promise<void>,
	query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
) {
	return migrateFn(migrations, current_version, exec, query)
}

export function validateMigrations() {
	return validateMigrationsFn(migrations)
}
