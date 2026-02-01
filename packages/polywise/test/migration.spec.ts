import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { CURRENT_SCHEMA_VERSION, migrate, migrations, validateMigrations } from '../src/migration'
import * as sql_meta from '../src/sql/meta'

describe('Migration System', () => {
	describe('validateMigrations', () => {
		it('should pass with valid sequential migrations', () => {
			expect(() => validateMigrations()).not.toThrow()
		})
	})

	describe('CURRENT_SCHEMA_VERSION', () => {
		it('should match the highest migration version', () => {
			const max_version = Math.max(...migrations.map(m => m.version))
			expect(CURRENT_SCHEMA_VERSION).toBe(max_version)
		})
	})

	describe('migrate function', () => {
		let db: PGlite
		const db_path = ':polywise_migration_main:'

		beforeAll(async () => {
			db = new PGlite(db_path)
			await db.exec(sql_meta.sql_create_schema_meta)
			await db.exec(sql_meta.sql_create_table_schema_version)
		})

		afterAll(async () => {
			await db.close()
		})

		const exec = async (sql: string | string[]) => {
			if (Array.isArray(sql)) {
				for (const s of sql) {
					await db.exec(s)
				}
			} else {
				await db.exec(sql)
			}
		}

		const query = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
			const res = await db.query(sql, params)
			return JSON.parse(JSON.stringify(res.rows))
		}

		it('should apply all migrations from version 0', async () => {
			await migrate(0, exec, query)

			const version_result = await query<{ version: number }>(sql_meta.sql_get_current_version)
			expect(version_result[0].version).toBe(CURRENT_SCHEMA_VERSION)
		})

		it('should skip already applied migrations', async () => {
			const version_result_before = await query<{ version: number }>(sql_meta.sql_get_current_version)
			const current_version = version_result_before[0].version

			await migrate(current_version, exec, query)

			const version_result_after = await query<{ version: number }>(sql_meta.sql_get_current_version)
			expect(version_result_after[0].version).toBe(current_version)
		})

		it('should create brain schema tables', async () => {
			const tables = await query(`
				SELECT table_name 
				FROM information_schema.tables 
				WHERE table_schema = 'brain'
			`)
			const table_names = tables.map((t: any) => t.table_name)

			expect(table_names).toContain('nodes')
			expect(table_names).toContain('edges')
			expect(table_names).toContain('node_sources')
		})

		it('should create knowledge schema tables', async () => {
			const tables = await query(`
				SELECT table_name 
				FROM information_schema.tables 
				WHERE table_schema = 'knowledge'
			`)
			const table_names = tables.map((t: any) => t.table_name)

			expect(table_names).toContain('articles')
		})
	})

	describe('Migration with data transformation', () => {
		let db: PGlite
		const db_path = ':polywise_migration_transform:'

		beforeAll(async () => {
			db = new PGlite(db_path)
			await db.exec(sql_meta.sql_create_schema_meta)
			await db.exec(sql_meta.sql_create_table_schema_version)
		})

		afterAll(async () => {
			await db.close()
		})

		const exec = async (sql: string | string[]) => {
			if (Array.isArray(sql)) {
				for (const s of sql) {
					await db.exec(s)
				}
			} else {
				await db.exec(sql)
			}
		}

		const query = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
			const res = await db.query(sql, params)
			return JSON.parse(JSON.stringify(res.rows))
		}

		it('should handle ALTER TABLE migration', async () => {
			await migrate(0, exec, query)

			await exec(`ALTER TABLE brain.nodes ADD COLUMN IF NOT EXISTS test_column TEXT;`)

			const columns = await query(`
				SELECT column_name 
				FROM information_schema.columns 
				WHERE table_name = 'nodes' AND table_schema = 'brain'
			`)
			const column_names = columns.map((c: any) => c.column_name)

			expect(column_names).toContain('test_column')
		})

		it('should migrate existing data when adding new column', async () => {
			await exec(`
				INSERT INTO brain.nodes (label, x, y, test_column) 
				VALUES ('TestNode', 0, 0, 'initial_value')
			`)

			const nodes = await query<{ label: string; test_column: string }>(
				`SELECT label, test_column FROM brain.nodes WHERE label = 'TestNode'`
			)

			expect(nodes[0].test_column).toBe('initial_value')
		})
	})
})
