import Piscina from 'piscina'

import { PGlite } from '@electric-sql/pglite'

import type { WorkerResult, WorkerTask } from './worker'

export class Polywise {
	private pool: Piscina | null = null
	private db: PGlite | null = null
	private init_promise: Promise<any> | null = null

	constructor(dataDir?: string, mode: 'proxy' | 'engine' = 'proxy') {
		if (mode === 'proxy') {
			this.pool = new Piscina({
				filename: new URL('./worker.ts', import.meta.url).href
			})
			this.init_promise = this.runTask('initDB', [dataDir || ':polywise:'])
		} else {
			this.db = new PGlite(dataDir, {
				relaxedDurability: true
			})
			this.init_promise = Promise.resolve()
		}
	}

	private async runTask<T extends WorkerTask['task']>(
		task: T,
		args: Extract<WorkerTask, { task: T }>['args']
	): Promise<any> {
		if (this.pool) {
			if (task !== 'initDB') {
				await this.init_promise
			}
			const result: WorkerResult = await this.pool.run({ task, args })
			if (result.status === 'error') {
				throw new Error(result.message)
			}
			return result.data
		}

		// Engine mode logic
		// @ts-ignore
		return await this[task](...args)
	}

	// --- Task Handlers (Internal/Engine Mode) ---

	async initDB(dataDir?: string) {
		return 'DB Initialized'
	}

	async exec(sql: string): Promise<void> {
		if (this.pool) return await this.runTask('exec', [sql])
		if (!this.db) throw new Error('DB not initialized')
		await this.db.exec(sql)
	}

	async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
		if (this.pool) return await this.runTask('query', [sql, params || []])
		if (!this.db) throw new Error('DB not initialized')
		const res = await this.db.query(sql, params)
		return JSON.parse(JSON.stringify(res.rows))
	}

	async tick(threshold_override?: number): Promise<void> {
		if (this.pool) return await this.runTask('tick', [threshold_override ?? 0.5])
		if (!this.db) throw new Error('DB not initialized')
		const threshold = threshold_override ?? 0.5
		await this.db.exec(`
      WITH incoming_signals AS (
        SELECT 
          e.target_id, 
          SUM(n.activation * e.weight / (e.distance + 0.1)) as total_input
        FROM brain.edges e
        JOIN brain.nodes n ON e.source_id = n.id
        WHERE n.activation > 0
        GROUP BY e.target_id
      )
      UPDATE brain.nodes
      SET potential = LEAST(potential + COALESCE((SELECT total_input FROM incoming_signals WHERE incoming_signals.target_id = brain.nodes.id), 0), 2.0);

      UPDATE brain.nodes
      SET 
        activation = CASE WHEN potential > ${threshold} THEN 1.0 ELSE 0.0 END,
        potential = CASE WHEN potential > ${threshold} THEN 0.0 ELSE potential * 0.9 END,
        last_fired_at = CASE WHEN potential > ${threshold} THEN CURRENT_TIMESTAMP ELSE last_fired_at END;

      UPDATE brain.edges e
      SET weight = CASE 
        WHEN (SELECT activation FROM brain.nodes WHERE id = e.source_id) > 0 
             AND (SELECT activation FROM brain.nodes WHERE id = e.target_id) > 0 
        THEN LEAST(weight + (0.2 * e.learning_rate), 5.0)
        ELSE GREATEST(weight - (0.001 / e.decay_resistance), 0.1)
      END;

      UPDATE brain.edges
      SET distance = GREATEST(1.0 / (weight + 0.1), 0.2);
    `)
	}

	// --- Public API ---

	async addNode(label: string, x: number, y: number, threshold = 0.5): Promise<number> {
		const rows = await this.query<{ id: number }>(
			'INSERT INTO brain.nodes (label, x, y, threshold) VALUES ($1, $2, $3, $4) RETURNING id',
			[label, x, y, threshold]
		)
		return rows[0].id
	}

	async connect(source_id: number, target_id: number, weight = 0.1): Promise<void> {
		await this.query('INSERT INTO brain.edges (source_id, target_id, weight) VALUES ($1, $2, $3)', [
			source_id,
			target_id,
			weight
		])
	}

	async stimulate(node_id: number, intensity = 1.0): Promise<void> {
		await this.query('UPDATE brain.nodes SET potential = potential + $1 WHERE id = $2', [intensity, node_id])
	}

	async getSnapshot(weight_threshold = 0.2) {
		const nodes = await this.query(
			'SELECT id, label, x, y, activation, potential FROM brain.nodes WHERE potential > 0.05 OR id IN (SELECT source_id FROM brain.edges WHERE weight > $1) OR id IN (SELECT target_id FROM brain.edges WHERE weight > $1)',
			[weight_threshold]
		)
		const edges = await this.query(
			'SELECT source_id, target_id, weight, distance, type FROM brain.edges WHERE weight > $1 ORDER BY weight DESC LIMIT 500',
			[weight_threshold]
		)

		return {
			nodes,
			edges
		}
	}

	async initSchema(): Promise<void> {
		await this.exec('CREATE SCHEMA IF NOT EXISTS brain;')

		await this.exec(`
      CREATE TABLE IF NOT EXISTS brain.nodes (
        id SERIAL PRIMARY KEY,
        label TEXT UNIQUE,
        x REAL, 
        y REAL,
        potential REAL DEFAULT 0.0,
        activation REAL DEFAULT 0.0, 
        threshold REAL DEFAULT 0.5,
        last_fired_at TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS brain.edges (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES brain.nodes(id),
        target_id INTEGER REFERENCES brain.nodes(id),
        weight REAL DEFAULT 0.1,
        distance REAL DEFAULT 1.0,
        type TEXT,
        learning_rate REAL DEFAULT 1.0,
        decay_resistance REAL DEFAULT 1.0
      );
      
      CREATE INDEX IF NOT EXISTS idx_edge_src ON brain.edges(source_id);
      CREATE INDEX IF NOT EXISTS idx_edge_tgt ON brain.edges(target_id);
      
      CREATE INDEX IF NOT EXISTS idx_active_edges 
      ON brain.edges (source_id, target_id, weight) 
      WHERE weight > 0.1;

      CREATE INDEX IF NOT EXISTS idx_core_truth
      ON brain.edges (source_id, target_id)
      WHERE decay_resistance > 1.5;
    `)

		await this.exec('CREATE SCHEMA IF NOT EXISTS knowledge;')
		await this.exec(`
      CREATE TABLE IF NOT EXISTS knowledge.articles (
        id SERIAL PRIMARY KEY,
        title TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

		await this.exec(`
      CREATE TABLE IF NOT EXISTS brain.node_sources (
        node_id INTEGER REFERENCES brain.nodes(id),
        article_id INTEGER REFERENCES knowledge.articles(id),
        PRIMARY KEY (node_id, article_id)
      );
    `)

		await this.exec('CREATE SCHEMA IF NOT EXISTS user_space;')
	}

	// --- Input-related functionality (moved from Input.ts) ---

	async processArticle(
		title: string,
		content: string,
		triples: Array<{
			subject: string
			predicate: string
			object: string
			learning_rate: number
			decay_resistance: number
		}>
	): Promise<void> {
		const res = await this.query(
			'INSERT INTO knowledge.articles (title, content) VALUES ($1, $2) RETURNING id',
			[title, content]
		)
		const article_id = res[0].id

		await this.injectTriples(triples, article_id)
	}

	private async injectTriples(
		triples: Array<{
			subject: string
			predicate: string
			object: string
			learning_rate: number
			decay_resistance: number
		}>,
		article_id: number
	): Promise<void> {
		await this.exec('BEGIN')

		for (const t of triples) {
			const sub_id = await this.upsertNode(t.subject, article_id)
			const obj_id = await this.upsertNode(t.object, article_id)

			await this.exec(`
        INSERT INTO brain.edges (source_id, target_id, weight, type, learning_rate, decay_resistance)
        VALUES (${sub_id}, ${obj_id}, ${0.5 * t.learning_rate}, '${t.predicate}', ${t.learning_rate}, ${t.decay_resistance})
        ON CONFLICT DO NOTHING;
      `)

			await this.exec(`
        UPDATE brain.edges 
        SET 
          learning_rate = GREATEST(learning_rate, ${t.learning_rate}),
          decay_resistance = GREATEST(decay_resistance, ${t.decay_resistance}),
          weight = LEAST(weight + ${0.5 * t.learning_rate}, 5.0) 
        WHERE source_id = ${sub_id} AND target_id = ${obj_id};
      `)
		}

		await this.exec('COMMIT')
	}

	private async upsertNode(label: string, article_id: number): Promise<number> {
		await this.query(
			`
      INSERT INTO brain.nodes (label, x, y, potential)
      VALUES ($1, random() * 800, random() * 600, 1.0)
      ON CONFLICT (label) DO UPDATE SET potential = brain.nodes.potential + 0.5;
    `,
			[label]
		)

		const res = await this.query('SELECT id FROM brain.nodes WHERE label = $1', [label])
		const nid = res[0].id

		await this.query(
			'INSERT INTO brain.node_sources (node_id, article_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;',
			[nid, article_id]
		)

		return nid
	}
}
