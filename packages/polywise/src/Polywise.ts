import Piscina from 'piscina'

import { PGlite } from '@electric-sql/pglite'

import * as sql from './sql'

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
			this.db = new PGlite(dataDir || ':polywise:', {
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

		return await (this as any)[task](...args)
	}

	async initSchema(): Promise<void> {
		if (this.pool) {
			await this.runTask('initSchema', [])
		} else {
			await this.exec(sql.sql_createSchemaBrain)
			await this.exec(sql.sql_createTableNodes)
			await this.exec(sql.sql_createTableEdges)
			await this.exec(sql.sql_createIndexEdgeSrc)
			await this.exec(sql.sql_createIndexEdgeTgt)
			await this.exec(sql.sql_createIndexActiveEdges)
			await this.exec(sql.sql_createIndexCoreTruth)
			await this.exec(sql.sql_createSchemaKnowledge)
			await this.exec(sql.sql_createTableArticles)
			await this.exec(sql.sql_createTableNodeSources)
			await this.exec(sql.sql_createSchemaUserSpace)
		}
	}

	async addNode(label: string, x: number, y: number, threshold = 0.5): Promise<number> {
		if (this.pool) {
			return await this.runTask('addNode', [label, x, y, threshold])
		}
		const rows = await this.query(sql.sql_addNode, [label, x, y, threshold])
		return rows[0].id
	}

	async connect(source_id: number, target_id: number, weight = 0.1): Promise<void> {
		if (this.pool) {
			await this.runTask('connect', [source_id, target_id, weight])
		} else {
			await this.query(sql.sql_connect, [source_id, target_id, weight])
		}
	}

	async stimulate(node_id: number, intensity = 1.0): Promise<void> {
		if (this.pool) {
			await this.runTask('stimulate', [node_id, intensity])
		} else {
			await this.query(sql.sql_stimulate, [intensity, node_id])
		}
	}

	async getSnapshot(weight_threshold = 0.2) {
		if (this.pool) {
			return await this.runTask('getSnapshot', [weight_threshold])
		}
		const nodes = await this.query(sql.sql_getSnapshotNodes(weight_threshold))
		const edges = await this.query(sql.sql_getSnapshotEdges(weight_threshold))
		return { nodes, edges }
	}

	async tick(threshold_override?: number): Promise<void> {
		if (this.pool) {
			await this.runTask('tick', [threshold_override ?? 0.5])
		} else {
			const threshold = threshold_override ?? 0.5
			await this.db!.exec(sql.sql_tick(threshold))
		}
	}

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
		if (this.pool) {
			await this.runTask('processArticle', [title, content, triples])
		} else {
			const res = await this.query(sql.sql_processArticle, [title, content])
			const article_id = res[0].id
			await this.injectTriples(triples, article_id)
		}
	}

	async runShadowTick(): Promise<void> {
		if (this.pool) {
			await this.runTask('runShadowTick', [])
		} else {
			await this.db!.exec(sql.sql_runShadowTick)
			await this.tick(0.8)
		}
	}

	async triggerSleepTick(): Promise<void> {
		if (this.pool) {
			await this.runTask('triggerSleepTick', [])
		} else {
			await this.db!.exec(sql.sql_sleepTickBegin)
			await this.db!.exec(sql.sql_sleepTickCleanNoise)
			await this.db!.exec(sql.sql_sleepTickDecay)
			await this.db!.exec(sql.sql_sleepTickReplay)
			await this.db!.exec(sql.sql_sleepTickResetNodes)
			await this.db!.exec(sql.sql_sleepTickCommit)
		}
	}

	private async exec(sql_str: string): Promise<void> {
		if (this.pool) return await this.runTask('exec', [sql_str])
		if (!this.db) throw new Error('DB not initialized')
		await this.db.exec(sql_str)
	}

	private async query<T = any>(sql_str: string, params?: any[]): Promise<T[]> {
		if (this.pool) return await this.runTask('query', [sql_str, params || []])
		if (!this.db) throw new Error('DB not initialized')
		const res = await this.db.query(sql_str, params)
		return JSON.parse(JSON.stringify(res.rows))
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
		await this.exec(sql.sql_injectTriplesBegin)

		for (const t of triples) {
			const sub_id = await this.upsertNode(t.subject, article_id)
			const obj_id = await this.upsertNode(t.object, article_id)

			await this.exec(
				sql.sql_injectTriplesInsertEdge(
					sub_id,
					obj_id,
					t.learning_rate,
					t.decay_resistance,
					t.predicate,
					0.5 * t.learning_rate
				)
			)
			await this.exec(
				sql.sql_injectTriplesUpdateEdge(
					sub_id,
					obj_id,
					t.learning_rate,
					t.decay_resistance,
					0.5 * t.learning_rate
				)
			)
		}

		await this.exec(sql.sql_injectTriplesCommit)
	}

	private async upsertNode(label: string, article_id: number): Promise<number> {
		await this.query(sql.sql_upsertNode, [label])
		const res = await this.query(sql.sql_upsertNodeSelect, [label])
		const nid = res[0].id
		await this.query(sql.sql_nodeSources, [nid, article_id])
		return nid
	}
}
