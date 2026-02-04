import { SCHEMA_BRAIN, SCHEMA_KNOWLEDGE } from '../consts'
import * as sql_schema from '../sql/schema'
import migrateFn from './migrate'
import validateMigrationsFn from './validateMigrations'

import type { Migration } from '../types'

export const CURRENT_SCHEMA_VERSION = 6

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
				`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';`,
				`ALTER TABLE ${SCHEMA_BRAIN}.edges ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';`
			])
		}
	},
	{
		version: 4,
		description: 'Add React system columns: embedding, is_action for nodes; is_habit, reaction_count for edges',
		up: async exec => {
			await exec([
				`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS embedding vector(1024);`,
				`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS is_action BOOLEAN DEFAULT false;`,
				`ALTER TABLE ${SCHEMA_BRAIN}.edges ADD COLUMN IF NOT EXISTS is_habit BOOLEAN DEFAULT false;`,
				`ALTER TABLE ${SCHEMA_BRAIN}.edges ADD COLUMN IF NOT EXISTS reaction_count INTEGER DEFAULT 0;`,
				sql_schema.sql_create_index_nodes_embedding
			])
		}
	},
	{
		version: 5,
		description: 'Optimization: Ensure pure text article index is up to date',
		up: async exec => {
			await exec([
				`DROP INDEX IF EXISTS idx_article_content_gin;`,
				sql_schema.sql_create_index_article_content_gin
			])
		}
	},
	{
		version: 6,
		description: 'Add context columns to articles: idol_id, root_ids, metrics_ids',
		up: async exec => {
			await exec([
				`ALTER TABLE ${SCHEMA_KNOWLEDGE}.articles ADD COLUMN IF NOT EXISTS idol_id TEXT;`,
				`ALTER TABLE ${SCHEMA_KNOWLEDGE}.articles ADD COLUMN IF NOT EXISTS root_ids TEXT[] DEFAULT '{}';`,
				`ALTER TABLE ${SCHEMA_KNOWLEDGE}.articles ADD COLUMN IF NOT EXISTS metrics_ids TEXT[] DEFAULT '{}';`,
				`CREATE INDEX IF NOT EXISTS idx_articles_idol ON ${SCHEMA_KNOWLEDGE}.articles(idol_id);`,
				`CREATE INDEX IF NOT EXISTS idx_articles_roots ON ${SCHEMA_KNOWLEDGE}.articles USING GIN(root_ids);`
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
