import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite/vector'

import Article from './Article'
import Brain from './Brain'
import * as sql from './sql'
import * as sql_meta from './sql/meta'
import { calculateWeight, CURRENT_SCHEMA_VERSION, migrate, validateMigrations } from './utils'

import type {
	AddNodeArgs,
	ConnectArgs,
	Edge,
	InjectTriplesArgs,
	Node,
	PolywiseArgs,
	ProcessArticleArgs,
	UpsertNodeArgs
} from './types'

export default class Polywise {
	private db: PGlite | null = null

	public article: Article
	public brain: Brain

	constructor(args: PolywiseArgs = {}) {
		const { data_dir, embedding_cache_dir, onTick } = args

		this.db = new PGlite(data_dir || ':polywise:', {
			relaxedDurability: true,
			extensions: { vector }
		})

		this.article = new Article({
			db: this.db,
			embedding_cache_dir
		})

		this.brain = new Brain({
			poly: this,
			onTick
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

	async addNode(args: AddNodeArgs) {
		const { label, x, y, threshold, idol_id, root_ids, metrics_ids, metadata } = args

		const rows = await this.query<{ id: number }>(sql.sql_add_node, [
			label,
			x,
			y,
			threshold ?? 0.5,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {})
		])

		return rows[0].id
	}

	async connect(args: ConnectArgs) {
		const { source_id, target_id, weight, idol_id, root_ids, metrics_ids, metadata } = args

		await this.query(sql.sql_connect, [
			source_id,
			target_id,
			weight ?? 0.1,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {})
		])
	}

	async stimulate(node_id: number, intensity = 1.0) {
		await this.query(sql.sql_stimulate, [intensity, node_id])
	}

	async getSnapshot(weight_threshold = 0.2) {
		const nodes = await this.query<Node[]>(sql.sql_get_snapshot_nodes(weight_threshold))

		const edges = await this.query<Edge[]>(sql.sql_get_snapshot_edges(weight_threshold))

		return { nodes, edges }
	}

	async getAllNodes() {
		return await this.query<Node[]>(
			'SELECT id, label, x, y, activation, potential, idol_id, root_ids, metrics_ids, metadata FROM brain.nodes'
		)
	}

	async getNodesByIdol(idol_id: string) {
		return await this.query<Node[]>(sql.sql_get_nodes_by_idol, [idol_id])
	}

	async getNodesByRoot(root_id: string) {
		return await this.query<Node[]>(sql.sql_get_nodes_by_root, [root_id])
	}

	async getEdgesByIdol(idol_id: string) {
		return await this.query<Edge[]>(sql.sql_get_edges_by_idol, [idol_id])
	}

	async getEdgesByRoot(root_id: string) {
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

	async processArticle(args: ProcessArticleArgs) {
		const { title, content, triples, idol_id, root_ids, metrics_ids, generate_embedding } = args

		const res = await this.query<{ id: number }>(sql.sql_process_article, [title, content])

		const article_id = res[0].id

		if (generate_embedding ?? true) {
			await this.article.addEmbedding(article_id, content)
		}

		await this._injectTriples({
			triples,
			article_id,
			idol_id,
			root_ids,
			metrics_ids
		})
	}

	private async _injectTriples(args: InjectTriplesArgs) {
		const { triples, article_id, idol_id, root_ids, metrics_ids } = args

		await this.exec(sql.sql_inject_triples_begin)

		for (const t of triples) {
			const sub_id = await this._upsertNode({
				label: t.subject,
				article_id,
				idol_id,
				root_ids,
				metrics_ids,
				metadata: t.metadata
			})

			const obj_id = await this._upsertNode({
				label: t.object,
				article_id,
				idol_id,
				root_ids,
				metrics_ids,
				metadata: t.metadata
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
					idol_id,
					root_ids,
					metrics_ids,
					t.metadata
				)
			)

			await this.exec(
				sql.sql_inject_triples_update_edge(
					sub_id,
					obj_id,
					t.learning_rate,
					t.decay_resistance,
					weight,
					idol_id,
					root_ids,
					metrics_ids,
					t.metadata
				)
			)
		}

		await this.exec(sql.sql_inject_triples_commit)
	}

	private async _upsertNode(args: UpsertNodeArgs) {
		const { label, article_id, idol_id, root_ids, metrics_ids, metadata } = args

		await this.query(sql.sql_upsert_node, [
			label,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null,
			JSON.stringify(metadata ?? {})
		])

		const res = await this.query<{ id: number }>(sql.sql_upsert_node_select, [label])

		const nid = res[0].id

		await this.query(sql.sql_node_sources, [nid, article_id])

		return nid
	}

	private async exec(sql_input: string | Array<string>) {
		if (!this.db) {
			throw new Error('DB not initialized')
		}

		if (Array.isArray(sql_input)) {
			for (const sql_str of sql_input) {
				await this.db.exec(sql_str)
			}

			return
		}

		await this.db.exec(sql_input)
	}

	private async query<T = any>(sql_str: string, params?: any[]) {
		if (!this.db) {
			throw new Error('DB not initialized')
		}

		const res = await this.db.query(sql_str, params)

		return JSON.parse(JSON.stringify(res.rows)) as T
	}

	async off() {
		this.brain.off()

		if (this.db) {
			await this.db.close()

			this.db = null
		}
	}
}
