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
		await this.exec(sql.sql_create_schema_brain)
		await this.exec(sql.sql_create_table_nodes)
		await this.exec(sql.sql_create_table_edges)
		await this.exec(sql.sql_create_index_edge_src)
		await this.exec(sql.sql_create_index_edge_tgt)
		await this.exec(sql.sql_create_index_active_edges)
		await this.exec(sql.sql_create_index_core_truth)
		await this.exec(sql.sql_create_schema_knowledge)
		await this.exec(sql.sql_create_table_articles)
		await this.exec(sql.sql_create_table_node_sources)
		await this.exec(sql.sql_create_schema_user_space)
	}

	async addNode(label: string, x: number, y: number, threshold = 0.5): Promise<number> {
		const rows = await this.query<{ id: number }>(sql.sql_add_node, [label, x, y, threshold])
		return rows[0].id
	}

	async connect(source_id: number, target_id: number, weight = 0.1): Promise<void> {
		await this.query(sql.sql_connect, [source_id, target_id, weight])
	}

	async stimulate(node_id: number, intensity = 1.0): Promise<void> {
		await this.query(sql.sql_stimulate, [intensity, node_id])
	}

	async getSnapshot(weight_threshold = 0.2) {
		const nodes = await this.query(sql.sql_get_snapshot_nodes(weight_threshold))
		const edges = await this.query(sql.sql_get_snapshot_edges(weight_threshold))
		return { nodes, edges }
	}

	async getAllNodes() {
		return await this.query('SELECT id, label, x, y, activation, potential FROM brain.nodes')
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
		const res = await this.query(sql.sql_process_article, [title, content])
		const article_id = res[0].id
		await this.inject_triples(triples, article_id)
	}

	async runShadowTick(): Promise<void> {
		await this.exec(sql.sql_run_shadow_tick)
		await this.tick(0.8)
	}

	async triggerSleepTick(): Promise<void> {
		await this.exec(sql.sql_sleep_tick_begin)
		await this.exec(sql.sql_sleep_tick_clean_noise)
		await this.exec(sql.sql_sleep_tick_decay)
		await this.exec(sql.sql_sleep_tick_replay)
		await this.exec(sql.sql_sleep_tick_reset_nodes)
		await this.exec(sql.sql_sleep_tick_commit)
	}

	private async inject_triples(
		triples: Array<{
			subject: string
			predicate: string
			object: string
			learning_rate: number
			decay_resistance: number
		}>,
		article_id: number
	): Promise<void> {
		await this.exec(sql.sql_inject_triples_begin)

		for (const t of triples) {
			const sub_id = await this.upsert_node(t.subject, article_id)
			const obj_id = await this.upsert_node(t.object, article_id)

			await this.exec(
				sql.sql_inject_triples_insert_edge(
					sub_id,
					obj_id,
					t.learning_rate,
					t.decay_resistance,
					t.predicate,
					0.5 * t.learning_rate
				)
			)
			await this.exec(
				sql.sql_inject_triples_update_edge(
					sub_id,
					obj_id,
					t.learning_rate,
					t.decay_resistance,
					0.5 * t.learning_rate
				)
			)
		}

		await this.exec(sql.sql_inject_triples_commit)
	}

	private async upsert_node(label: string, article_id: number): Promise<number> {
		await this.query(sql.sql_upsert_node, [label])
		const res = await this.query(sql.sql_upsert_node_select, [label])
		const nid = res[0].id
		await this.query(sql.sql_node_sources, [nid, article_id])
		return nid
	}
}
