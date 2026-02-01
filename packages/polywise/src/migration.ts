import * as sql_meta from './sql/meta'
import * as sql_schema from './sql/schema'

export type MigrationFn = (
	exec: (sql: string | string[]) => Promise<void>,
	query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
) => Promise<void>

export interface Migration {
	version: number
	description: string
	up: MigrationFn
}

export const CURRENT_SCHEMA_VERSION = 1

export const migrations: Migration[] = [
	{
		version: 1,
		description: 'Initial schema: brain nodes, edges, knowledge articles',
		up: async exec => {
			await exec([
				sql_schema.sql_create_schema_brain,
				sql_schema.sql_create_table_nodes,
				sql_schema.sql_create_table_edges,
				sql_schema.sql_create_index_edge_src,
				sql_schema.sql_create_index_edge_tgt,
				sql_schema.sql_create_index_active_edges,
				sql_schema.sql_create_index_core_truth,
				sql_schema.sql_create_schema_knowledge,
				sql_schema.sql_create_table_articles,
				sql_schema.sql_create_table_node_sources,
				sql_schema.sql_create_schema_user_space
			])
		}
	}
	// Example of future migrations:
	// {
	// 	version: 2,
	// 	description: 'Add metadata column to nodes',
	// 	up: async (exec, query) => {
	// 		// Add new column
	// 		await exec(`ALTER TABLE brain.nodes ADD COLUMN IF NOT EXISTS metadata JSONB;`)
	//
	// 		// Migrate existing data
	// 		const nodes = await query<{ id: number }>('SELECT id FROM brain.nodes')
	// 		for (const node of nodes) {
	// 			await query(
	// 				`UPDATE brain.nodes SET metadata = $1 WHERE id = $2`,
	// 				[JSON.stringify({}), node.id]
	// 			)
	// 		}
	// 	}
	// },
	// {
	// 	version: 3,
	// 	description: 'Rename edge weight to strength',
	// 	up: async (exec) => {
	// 		await exec(`
	// 			ALTER TABLE brain.edges RENAME COLUMN weight TO strength;
	// 		`)
	// 	}
	// }
]

export async function migrate(
	current_version: number,
	exec: (sql: string | string[]) => Promise<void>,
	query: <T = any>(sql: string, params?: any[]) => Promise<T[]>
): Promise<void> {
	const pending_migrations = migrations.filter(m => m.version > current_version)

	if (pending_migrations.length === 0) {
		return
	}

	for (const migration of pending_migrations) {
		await migration.up(exec, query)
		await query(sql_meta.sql_insert_version, [migration.version])
	}
}

export function validateMigrations(): void {
	const versions = migrations.map(m => m.version)
	const unique_versions = new Set(versions)

	if (versions.length !== unique_versions.size) {
		throw new Error('Duplicate migration versions detected')
	}

	for (let i = 0; i < versions.length; i++) {
		if (versions[i] !== i + 1) {
			throw new Error(`Migration versions must be sequential. Expected ${i + 1}, got ${versions[i]}`)
		}
	}
}
