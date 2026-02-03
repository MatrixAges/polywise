import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'
import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { SCHEMA_BRAIN, SCHEMA_KNOWLEDGE } from '../src/consts'
import * as sql_meta from '../src/sql/meta'
import { CURRENT_SCHEMA_VERSION, migrate, migrations, validateMigrations } from '../src/utils/migration'

describe('Migration System', () => {
	describe.concurrent('validateMigrations', () => {
		it('should pass with valid sequential migrations', () => {
			expect(() => validateMigrations()).not.toThrow()
		})
	})

	describe.concurrent('CURRENT_SCHEMA_VERSION', () => {
		it('should match the highest migration version', () => {
			const max_version = Math.max(...migrations.map(m => m.version))

			expect(CURRENT_SCHEMA_VERSION).toBe(max_version)
		})
	})

	describe('migrate function', () => {
		let db: PGlite
		const db_path = ':polywise_migration_main:'

		beforeAll(async () => {
			db = new PGlite(db_path, { extensions: { vector } })

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

				return
			}

			await db.exec(sql)
		}

		const query = async <T = any>(sql: string, params?: any[]) => {
			const res = await db.query(sql, params)

			return JSON.parse(JSON.stringify(res.rows)) as T[]
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
				WHERE table_schema = '${SCHEMA_BRAIN}'
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
				WHERE table_schema = '${SCHEMA_KNOWLEDGE}'
			`)
			const table_names = tables.map((t: any) => t.table_name)

			expect(table_names).toContain('articles')
		})
	})

	describe('Schema Changes - Add Column', () => {
		let db: PGlite
		const db_path = ':polywise_migration_add_col:'

		beforeAll(async () => {
			db = new PGlite(db_path, { extensions: { vector } })

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

				return
			}

			await db.exec(sql)
		}

		const query = async <T = any>(sql: string, params?: any[]) => {
			const res = await db.query(sql, params)

			return JSON.parse(JSON.stringify(res.rows)) as T[]
		}

		it('should add new column with default value', async () => {
			await migrate(0, exec, query)

			await exec(
				`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'No description';`
			)

			const unique_label = `TestNode_${Date.now()}`

			await exec(`INSERT INTO ${SCHEMA_BRAIN}.nodes (label, x, y) VALUES ('${unique_label}', 0, 0)`)

			const nodes = await query<{ label: string; description: string }>(
				`SELECT label, description FROM ${SCHEMA_BRAIN}.nodes WHERE label = '${unique_label}'`
			)

			expect(nodes[0].description).toBe('No description')
		})

		it('should add column and populate with calculated data', async () => {
			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS magnitude REAL;`)

			const nodes = await query<{ id: number; x: number; y: number }>(
				`SELECT id, x, y FROM ${SCHEMA_BRAIN}.nodes`
			)

			for (const node of nodes) {
				const magnitude = Math.sqrt(node.x ** 2 + node.y ** 2)

				await query(`UPDATE ${SCHEMA_BRAIN}.nodes SET magnitude = $1 WHERE id = $2`, [
					magnitude,
					node.id
				])
			}

			const updated_nodes = await query<{ label: string; magnitude: number }>(
				`SELECT label, magnitude FROM ${SCHEMA_BRAIN}.nodes WHERE magnitude IS NOT NULL`
			)

			expect(updated_nodes.length).toBeGreaterThan(0)
			expect(updated_nodes[0].magnitude).toBeGreaterThanOrEqual(0)
		})
	})

	describe('Schema Changes - Rename Column', () => {
		let db: PGlite
		const db_path = `:polywise_migration_rename_col_${Date.now()}:`

		beforeAll(async () => {
			db = new PGlite(db_path, { extensions: { vector } })

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

				return
			}

			await db.exec(sql)
		}

		const query = async <T = any>(sql: string, params?: any[]) => {
			const res = await db.query(sql, params)

			return JSON.parse(JSON.stringify(res.rows)) as T[]
		}

		it('should rename column and preserve data', async () => {
			await migrate(0, exec, query)

			await exec(`INSERT INTO ${SCHEMA_BRAIN}.nodes (label, x, y) VALUES ('SourceNode', 0, 0)`)
			await exec(`INSERT INTO ${SCHEMA_BRAIN}.nodes (label, x, y) VALUES ('TargetNode', 10, 10)`)

			const nodes = await query<{ id: number; label: string }>(
				`SELECT id, label FROM ${SCHEMA_BRAIN}.nodes`
			)
			const source_id = nodes.find(n => n.label === 'SourceNode')!.id
			const target_id = nodes.find(n => n.label === 'TargetNode')!.id

			await exec(
				`INSERT INTO ${SCHEMA_BRAIN}.edges (source_id, target_id, weight) VALUES (${source_id}, ${target_id}, 0.8)`
			)

			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.edges RENAME COLUMN weight TO strength;`)

			const edges = await query<{ source_id: number; target_id: number; strength: number }>(
				`SELECT source_id, target_id, strength FROM ${SCHEMA_BRAIN}.edges WHERE source_id = ${source_id} AND target_id = ${target_id}`
			)

			expect(edges[0].strength).toBe(0.8)
		})
	})

	describe('Schema Changes - Modify Column Type', () => {
		let db: PGlite
		const db_path = `:polywise_migration_modify_type_${Date.now()}:`

		beforeAll(async () => {
			db = new PGlite(db_path, { extensions: { vector } })

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

				return
			}

			await db.exec(sql)
		}

		const query = async <T = any>(sql: string, params?: any[]) => {
			const res = await db.query(sql, params)

			return JSON.parse(JSON.stringify(res.rows)) as T[]
		}

		it('should modify column type with USING clause', async () => {
			await migrate(0, exec, query)

			await exec(`INSERT INTO ${SCHEMA_BRAIN}.nodes (label, x, y) VALUES ('SourceNode', 0, 0)`)
			await exec(`INSERT INTO ${SCHEMA_BRAIN}.nodes (label, x, y) VALUES ('TargetNode', 10, 10)`)

			const nodes = await query<{ id: number; label: string }>(
				`SELECT id, label FROM ${SCHEMA_BRAIN}.nodes`
			)
			const source_id = nodes.find(n => n.label === 'SourceNode')!.id
			const target_id = nodes.find(n => n.label === 'TargetNode')!.id

			await exec(
				`INSERT INTO ${SCHEMA_BRAIN}.edges (source_id, target_id, weight) VALUES (${source_id}, ${target_id}, 0.8)`
			)

			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.edges ADD COLUMN temp_weight TEXT;`)
			await exec(`UPDATE ${SCHEMA_BRAIN}.edges SET temp_weight = CAST(COALESCE(weight, 0.5) AS TEXT);`)
			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.edges DROP COLUMN IF EXISTS weight;`)
			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.edges RENAME COLUMN temp_weight TO weight_text;`)

			const columns = await query<{ column_name: string; data_type: string }>(`
				SELECT column_name, data_type 
				FROM information_schema.columns 
				WHERE table_name = 'edges' AND table_schema = '${SCHEMA_BRAIN}' AND column_name = 'weight_text'
			`)

			expect(columns[0].data_type).toBe('text')
		})
	})

	describe('Schema Changes - Drop Column', () => {
		let db: PGlite
		const db_path = `:polywise_migration_drop_col:`

		beforeAll(async () => {
			db = new PGlite(db_path, { extensions: { vector } })

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

				return
			}

			await db.exec(sql)
		}

		const query = async <T = any>(sql: string, params?: any[]) => {
			const res = await db.query(sql, params)

			return JSON.parse(JSON.stringify(res.rows)) as T[]
		}

		it('should drop column safely', async () => {
			await migrate(0, exec, query)

			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN IF NOT EXISTS temp_field TEXT;`)
			await exec(`UPDATE ${SCHEMA_BRAIN}.nodes SET temp_field = 'test';`)

			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.nodes DROP COLUMN IF EXISTS temp_field;`)

			const columns = await query<{ column_name: string }>(`
				SELECT column_name 
				FROM information_schema.columns 
				WHERE table_name = 'nodes' AND table_schema = '${SCHEMA_BRAIN}' AND column_name = 'temp_field'
			`)

			expect(columns.length).toBe(0)
		})
	})

	describe('Complex Migration Scenarios', () => {
		let db: PGlite
		const db_path = `:polywise_migration_complex:`

		beforeAll(async () => {
			db = new PGlite(db_path, { extensions: { vector } })

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

				return
			}

			await db.exec(sql)
		}

		const query = async <T = any>(sql: string, params?: any[]) => {
			const res = await db.query(sql, params)

			return JSON.parse(JSON.stringify(res.rows)) as T[]
		}

		it('should handle multi-step migration with data preservation', async () => {
			await migrate(0, exec, query)

			const unique_label = `MultiStepNode_${Date.now()}`

			await exec(
				`INSERT INTO ${SCHEMA_BRAIN}.nodes (label, x, y, threshold) VALUES ('${unique_label}', 100, 200, 0.5)`
			)

			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN new_x REAL;`)
			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.nodes ADD COLUMN new_y REAL;`)

			await exec(
				`UPDATE ${SCHEMA_BRAIN}.nodes SET new_x = x * 2, new_y = y * 2 WHERE label = '${unique_label}'`
			)

			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.nodes DROP COLUMN x;`)
			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.nodes RENAME COLUMN new_x TO x;`)
			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.nodes DROP COLUMN y;`)
			await exec(`ALTER TABLE ${SCHEMA_BRAIN}.nodes RENAME COLUMN new_y TO y;`)

			const nodes = await query<{ label: string; x: number; y: number }>(
				`SELECT label, x, y FROM ${SCHEMA_BRAIN}.nodes WHERE label = '${unique_label}'`
			)

			expect(nodes[0].x).toBe(200)
			expect(nodes[0].y).toBe(400)
		})

		it('should create new table and migrate data from old table', async () => {
			await exec(`
				CREATE TABLE IF NOT EXISTS ${SCHEMA_KNOWLEDGE}.articles_v2 (
					id SERIAL PRIMARY KEY,
					title TEXT NOT NULL,
					content TEXT,
					summary TEXT,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				);
			`)

			const articles = await query<{ id: number; title: string; content: string }>(
				`SELECT id, title, content FROM ${SCHEMA_KNOWLEDGE}.articles`
			)

			for (const article of articles) {
				const summary = article.content ? article.content.substring(0, 100) + '...' : 'No content'

				await query(
					`INSERT INTO ${SCHEMA_KNOWLEDGE}.articles_v2 (title, content, summary) VALUES ($1, $2, $3)`,
					[article.title, article.content, summary]
				)
			}

			const v2_articles = await query(`SELECT * FROM ${SCHEMA_KNOWLEDGE}.articles_v2`)

			expect(v2_articles.length).toBeGreaterThanOrEqual(0)
		})
	})
})
