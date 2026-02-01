import { PGlite } from '@electric-sql/pglite'

import Article from './Article'
import { CURRENT_SCHEMA_VERSION, migrate, validateMigrations } from './migration'
import * as sql from './sql'
import * as sql_meta from './sql/meta'
import { calculateWeight } from './utils'

import type {
	AddNodeParams,
	ConnectParams,
	Edge,
	InjectTriplesParams,
	Node,
	ProcessArticleParams,
	Snapshot,
	Triple,
	UpsertNodeParams
} from './types'

export default class Polywise {
	private db: PGlite | null = null
	public article: Article

	constructor(data_dir?: string, embeddingCacheDir?: string) {
		this.db = new PGlite(data_dir || ':polywise:', {
			relaxedDurability: true
		})
		this.article = new Article({
			exec: this.exec.bind(this),
			query: this.query.bind(this),
			embeddingCacheDir
		})
	}

	async init() {
		validateMigrations()

		await this.exec(sql_meta.sql_create_schema_meta)
		await this.exec(sql_meta.sql_create_table_schema_version)

		const version_result = await this.query<{ version: number }>(sql_meta.sql_get_current_version)
		const current_version = version_result[0]?.version ?? 0

		if (current_version < CURRENT_SCHEMA_VERSION) {
			await migrate(current_version, this.exec.bind(this), this.query.bind(this))
		}
	}

	async addNode(params: AddNodeParams) {
		const rows = await this.query<{ id: number }>(sql.sql_add_node, [
			params.label,
			params.x,
			params.y,
			params.threshold ?? 0.5,
			params.idol_id ?? null,
			params.root_ids ?? null,
			params.metrics_ids ?? null
		])

		return rows[0].id
	}

	async connect(params: ConnectParams) {
		await this.query(sql.sql_connect, [
			params.source_id,
			params.target_id,
			params.weight ?? 0.1,
			params.idol_id ?? null,
			params.root_ids ?? null,
			params.metrics_ids ?? null
		])
	}

	async stimulate(node_id: number, intensity = 1.0) {
		await this.query(sql.sql_stimulate, [intensity, node_id])
	}

	async getSnapshot(weight_threshold = 0.2): Promise<Snapshot> {
		const nodes = await this.query<Node[]>(sql.sql_get_snapshot_nodes(weight_threshold))
		const edges = await this.query<Edge[]>(sql.sql_get_snapshot_edges(weight_threshold))

		return { nodes, edges }
	}

	async getAllNodes(): Promise<Node[]> {
		return await this.query<Node[]>(
			'SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids FROM brain.nodes'
		)
	}

	async getNodesByIdol(idol_id: string): Promise<Node[]> {
		return await this.query<Node[]>(sql.sql_get_nodes_by_idol, [idol_id])
	}

	async getNodesByRoot(root_id: string): Promise<Node[]> {
		return await this.query<Node[]>(sql.sql_get_nodes_by_root, [root_id])
	}

	async getEdgesByIdol(idol_id: string): Promise<Edge[]> {
		return await this.query<Edge[]>(sql.sql_get_edges_by_idol, [idol_id])
	}

	async getEdgesByRoot(root_id: string): Promise<Edge[]> {
		return await this.query<Edge[]>(sql.sql_get_edges_by_root, [root_id])
	}

	async tick(threshold_override?: number) {
		const threshold = threshold_override ?? 0.5

		await this.exec(sql.sql_tick(threshold))
	}

	async runShadowTick() {
		await this.exec(sql.sql_run_shadow_tick)

		await this.tick(0.8)
	}

	async triggerSleepTick() {
		await this.exec([
			sql.sql_sleep_tick_begin,
			sql.sql_sleep_tick_clean_noise,
			sql.sql_sleep_tick_decay,
			sql.sql_sleep_tick_replay,
			sql.sql_sleep_tick_reset_nodes,
			sql.sql_sleep_tick_commit
		])
	}

	async processArticle(params: ProcessArticleParams) {
		const res = await this.query<{ id: number }>(sql.sql_process_article, [params.title, params.content])
		const article_id = res[0].id

		if (params.generate_embedding ?? true) {
			await this.article.addEmbedding(article_id, params.content)
		}

		await this.inject_triples({
			triples: params.triples,
			article_id,
			idol_id: params.idol_id,
			root_ids: params.root_ids,
			metrics_ids: params.metrics_ids
		})
	}

	private async exec(sql_input: string | Array<string>) {
		if (!this.db) throw new Error('DB not initialized')

		if (Array.isArray(sql_input)) {
			for (const sql_str of sql_input) {
				await this.db.exec(sql_str)
			}
		} else {
			await this.db.exec(sql_input)
		}
	}

	private async query<T = any>(sql_str: string, params?: any[]): Promise<T> {
		if (!this.db) throw new Error('DB not initialized')

		const res = await this.db.query(sql_str, params)

		return JSON.parse(JSON.stringify(res.rows)) as T
	}

	private async inject_triples(params: InjectTriplesParams) {
		await this.exec(sql.sql_inject_triples_begin)

		for (const t of params.triples) {
			const sub_id = await this.upsert_node({
				label: t.subject,
				article_id: params.article_id,
				idol_id: params.idol_id,
				root_ids: params.root_ids,
				metrics_ids: params.metrics_ids
			})
			const obj_id = await this.upsert_node({
				label: t.object,
				article_id: params.article_id,
				idol_id: params.idol_id,
				root_ids: params.root_ids,
				metrics_ids: params.metrics_ids
			})
			const weight = calculateWeight(t.learning_rate)

			await this.exec(
				sql.sql_inject_triples_insert_edge(
					sub_id,
					obj_id,
					t.learning_rate,
					t.decay_resistance,
					t.predicate,
					weight,
					params.idol_id,
					params.root_ids,
					params.metrics_ids
				)
			)
			await this.exec(
				sql.sql_inject_triples_update_edge(
					sub_id,
					obj_id,
					t.learning_rate,
					t.decay_resistance,
					weight,
					params.idol_id,
					params.root_ids,
					params.metrics_ids
				)
			)
		}

		await this.exec(sql.sql_inject_triples_commit)
	}

	private async upsert_node(params: UpsertNodeParams) {
		await this.query(sql.sql_upsert_node, [
			params.label,
			params.idol_id ?? null,
			params.root_ids ?? null,
			params.metrics_ids ?? null
		])

		const res = await this.query<{ id: number }>(sql.sql_upsert_node_select, [params.label])
		const nid = res[0].id

		await this.query(sql.sql_node_sources, [nid, params.article_id])

		return nid
	}

	off() {
		if (this.db) {
			this.db.close()
			this.db = null
		}
	}
}
