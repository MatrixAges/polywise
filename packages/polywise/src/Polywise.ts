import { PGlite } from '@electric-sql/pglite'

import * as sql from './sql'

export class Polywise {
	private db: PGlite | null = null

	constructor(dataDir?: string) {
		this.db = new PGlite(dataDir || ':polywise:', {
			relaxedDurability: true
		})
	}

	private async exec(sql_str: string): Promise<void> {
		if (!this.db) throw new Error('DB not initialized')
		await this.db.exec(sql_str)
	}

	private async query<T = any>(sql_str: string, params?: any[]): Promise<T[]> {
		if (!this.db) throw new Error('DB not initialized')
		const res = await this.db.query(sql_str, params)
		return JSON.parse(JSON.stringify(res.rows))
	}

	async initSchema(): Promise<void> {
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

	async addNode(label: string, x: number, y: number, threshold = 0.5): Promise<number> {
		const rows = await this.query<{ id: number }>(sql.sql_addNode, [label, x, y, threshold])
		return rows[0].id
	}

	async connect(source_id: number, target_id: number, weight = 0.1): Promise<void> {
		await this.query(sql.sql_connect, [source_id, target_id, weight])
	}

	async stimulate(node_id: number, intensity = 1.0): Promise<void> {
		await this.query(sql.sql_stimulate, [intensity, node_id])
	}

	async getSnapshot(weight_threshold = 0.2) {
		const nodes = await this.query(sql.sql_getSnapshotNodes(weight_threshold))
		const edges = await this.query(sql.sql_getSnapshotEdges(weight_threshold))
		return { nodes, edges }
	}

	async tick(threshold_override?: number): Promise<void> {
		const threshold = threshold_override ?? 0.5
		await this.exec(sql.sql_tick(threshold))
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
		const res = await this.query(sql.sql_processArticle, [title, content])
		const article_id = res[0].id
		await this.injectTriples(triples, article_id)
	}

	async runShadowTick(): Promise<void> {
		await this.exec(sql.sql_runShadowTick)
		await this.tick(0.8)
	}

	async triggerSleepTick(): Promise<void> {
		await this.exec(sql.sql_sleepTickBegin)
		await this.exec(sql.sql_sleepTickCleanNoise)
		await this.exec(sql.sql_sleepTickDecay)
		await this.exec(sql.sql_sleepTickReplay)
		await this.exec(sql.sql_sleepTickResetNodes)
		await this.exec(sql.sql_sleepTickCommit)
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
