import { SCHEMA_BRAIN, SCHEMA_META } from '../consts'
import { sql_insert_version } from '../sql/meta'
import {
	sql_create_extension_vector,
	sql_create_index_active_edges,
	sql_create_index_article_content_gin,
	sql_create_index_article_embeddings_hnsw,
	sql_create_index_core_truth,
	sql_create_index_edge_src,
	sql_create_index_edge_tgt,
	sql_create_index_edges_idol,
	sql_create_index_edges_roots,
	sql_create_index_nodes_embedding,
	sql_create_index_nodes_idol,
	sql_create_index_nodes_roots,
	sql_create_schema_brain,
	sql_create_schema_memory,
	sql_create_schema_user_space,
	sql_create_table_article_embeddings,
	sql_create_table_articles,
	sql_create_table_edges,
	sql_create_table_node_sources,
	sql_create_table_nodes,
	sql_create_table_stats
} from '../sql/schema'

import type { Migration } from '../types'

export const CURRENT_SCHEMA_VERSION = 5

export const migrations: Array<Migration> = [
	{
		version: 1,
		description: 'Initialize complete schema: extensions, brain schema, memory schema, all tables and indexes',
		up: async exec => {
			await exec([
				sql_create_extension_vector,
				sql_create_schema_brain,
				sql_create_table_nodes,
				sql_create_table_edges,
				sql_create_index_edge_src,
				sql_create_index_edge_tgt,
				sql_create_index_active_edges,
				sql_create_index_core_truth,
				sql_create_index_nodes_idol,
				sql_create_index_edges_idol,
				sql_create_index_nodes_roots,
				sql_create_index_edges_roots,
				sql_create_index_nodes_embedding,
				sql_create_schema_memory,
				sql_create_table_articles,
				sql_create_table_article_embeddings,
				sql_create_index_article_embeddings_hnsw,
				sql_create_index_article_content_gin,
				sql_create_table_node_sources,
				sql_create_schema_user_space
			])
		}
	},
	{
		version: 2,
		description: 'Add article_ids to nodes, lock to nodes/edges, and create stats table',
		up: async exec => {
			await exec([
				`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS article_ids TEXT[] DEFAULT '{}'`,
				`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS lock BOOLEAN DEFAULT FALSE`,
				`ALTER TABLE ${SCHEMA_BRAIN}.edges ADD COLUMN IF NOT EXISTS lock BOOLEAN DEFAULT FALSE`,
				sql_create_table_stats,
				`INSERT INTO ${SCHEMA_META}.stats (key, value) VALUES ('input_count', '0'::jsonb) ON CONFLICT DO NOTHING`
			])
		}
	},
	{
		version: 3,
		description: 'Add is_active column for digital activation state',
		up: async exec => {
			await exec([
				`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE`
			])
		}
	},
	{
		version: 4,
		description: 'Add current_threshold for dynamic thresholding',
		up: async exec => {
			await exec([
				`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS current_threshold REAL DEFAULT 0.5`
			])
		}
	},
	{
		version: 5,
		description: 'Add transmitter pool for short-term depression',
		up: async exec => {
			await exec([
				`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS transmitter REAL DEFAULT 1.0`
			])
		}
	}
]

export async function migrate(
	current_version: number,
	exec: (sql: string | Array<string>) => Promise<void>,
	query: <T = any>(sql: string, params?: Array<any>) => Promise<Array<T>>
) {
	for (const migration of migrations) {
		if (migration.version > current_version) {
			await migration.up(exec, query)

			await query(sql_insert_version, [migration.version])
		}
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
