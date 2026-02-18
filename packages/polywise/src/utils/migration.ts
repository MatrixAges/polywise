import * as sql_schema from '../sql/schema'

import type { Migration } from '../types'

export const CURRENT_SCHEMA_VERSION = 1

export const migrations: Array<Migration> = [
	{
		version: 1,
		description: 'Initialize complete schema: extensions, brain schema, memory schema, all tables and indexes',
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
				sql_schema.sql_create_index_nodes_embedding,
				sql_schema.sql_create_schema_memory,
				sql_schema.sql_create_table_articles,
				sql_schema.sql_create_table_article_embeddings,
				sql_schema.sql_create_index_article_embeddings_hnsw,
				sql_schema.sql_create_index_article_content_gin,
				sql_schema.sql_create_table_node_sources,
				sql_schema.sql_create_schema_user_space
			])
		}
	}
]

export async function migrate(
	_current_version: number,
	exec: (sql: string | Array<string>) => Promise<void>,
	query: <T = any>(sql: string, params?: Array<any>) => Promise<Array<T>>
) {
	for (const migration of migrations) {
		await migration.up(exec, query)
	}
}

export function validateMigrations() {
	const versions = migrations.map(m => m.version)
	const unique_versions = new Set(versions)

	if (versions.length !== unique_versions.size) {
		throw new Error('Migration versions must be unique')
	}

	for (let i = 0; i < versions.length; i++) {
		if (versions[i] !== i + 1) {
			throw new Error(
				`Migration versions must be sequential starting from 1. Expected ${i + 1}, got ${versions[i]}`
			)
		}
	}
}
