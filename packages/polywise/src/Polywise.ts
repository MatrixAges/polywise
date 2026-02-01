import Piscina from 'piscina'

import type { WorkerResult, WorkerTask } from './worker'

export class Polywise {
	private pool: Piscina
	private init_promise: Promise<void>

	constructor(dataDir?: string) {
		this.pool = new Piscina({
			filename: new URL('./worker.ts', import.meta.url).href
		})

		this.init_promise = this.runTask('initDB', [dataDir || ':memory:'])
	}

	private async runTask<T extends WorkerTask['task']>(
		task: T,
		args: Extract<WorkerTask, { task: T }>['args']
	): Promise<any> {
		if (task !== 'initDB') {
			await this.init_promise
		}

		const result: WorkerResult = await this.pool.run({ task, args })

		if (result.status === 'error') {
			throw new Error(result.message)
		}

		return result.data
	}

	async exec(sql: string): Promise<void> {
		await this.runTask('exec', [sql])
	}

	async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
		return await this.runTask('query', [sql, params || []])
	}

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

	async tick(threshold_override?: number): Promise<void> {
		const threshold = threshold_override ?? 0.5
		await this.runTask('tick', [threshold])
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
}
