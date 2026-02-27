import { getId } from 'shared'
import { injectable } from 'tsyringe'

import { system } from '../consts'
import sql from '../sql'
import { getContextEdgeWeight, getReplayScores, querySql } from '../utils'

import type { Edge, SequenceFrontierItem, SequenceScore, SleepReplayPayload } from '../types'
import type Polywise from './polywise'

@injectable()
export default class Index {
	private p!: Polywise

	last_context_id?: string

	init(p: Polywise) {
		this.p = p
	}

	async getSequentialContext() {
		const sequence_scores = await this.getContextSequenceScores()

		if (!sequence_scores.length) return this.last_context_id

		return sequence_scores[0]?.context_id ?? this.last_context_id
	}

	async resolveContextIdForQuery(embedding: Array<number>) {
		if (!embedding || embedding.length === 0) return null

		const context_candidates = await this.findNearestContexts(embedding)

		const best_context = context_candidates[0]

		if (!best_context || best_context.similarity < system.context_query_threshold) {
			return await this.getSequentialContext()
		}

		return best_context.id
	}

	async resolveContextIdForSave(args: { embedding: Array<number>; keywords: Array<string> }) {
		const { embedding, keywords } = args

		if (!embedding || embedding.length === 0) {
			return 'global'
		}

		const context_candidates = await this.findNearestContexts(embedding)

		const best_context = context_candidates[0]
		const trimmed_keywords = keywords.slice(0, system.context_keywords_limit)

		if (best_context && best_context.similarity >= system.context_similarity_threshold) {
			await this.updateContext({
				context_id: best_context.id,
				embedding,
				keywords: trimmed_keywords
			})

			return best_context.id
		}

		return this.createContext({ embedding, keywords: trimmed_keywords })
	}

	async getSleepReplayPayload() {
		const sequence_scores = await this.getContextSequenceScores()
		const selected_scores = getReplayScores(sequence_scores)

		const context_ids: Array<string> = []
		const context_scores: Array<number> = []

		for (const selected_item of selected_scores) {
			context_ids.push(selected_item.context_id)
			context_scores.push(selected_item.score)
		}

		const payload: SleepReplayPayload = {
			context_ids,
			context_scores
		}

		return payload
	}

	async getContextSequenceScores() {
		if (!this.last_context_id) return [] as Array<SequenceScore>

		const scores = new Map<string, number>()

		let frontier: Array<SequenceFrontierItem> = [
			{
				context_id: this.last_context_id,
				base_score: 1,
				path_ids: new Set<string>([this.last_context_id])
			}
		]

		for (let step_index = 0; step_index < system.context_sequence_depth; step_index++) {
			if (!frontier.length) break

			const source_ids = this.collectFrontierSourceIds(frontier)
			const edges = await this.getContextEdgesBySources(source_ids, system.context_sequence_branch)

			if (!edges.length) break

			const edge_map = this.buildContextEdgeMap(edges)
			const hop_decay = Math.pow(system.context_sequence_hop_decay, step_index)
			const next_frontier: Array<SequenceFrontierItem> = []

			for (const frontier_item of frontier) {
				const source_edges = edge_map.get(frontier_item.context_id)

				if (!source_edges || !source_edges.length) continue

				for (const edge_item of source_edges) {
					if (!edge_item.target_id) continue

					const edge_weight = getContextEdgeWeight(edge_item)

					if (edge_weight <= 0) continue

					const score = frontier_item.base_score * edge_weight * hop_decay
					const prev_score = scores.get(edge_item.target_id) ?? 0

					scores.set(edge_item.target_id, prev_score + score)

					const reach_limit = step_index + 1 >= system.context_sequence_depth

					if (reach_limit) continue
					if (frontier_item.path_ids.has(edge_item.target_id)) continue

					const next_path_ids = new Set<string>(frontier_item.path_ids)

					next_path_ids.add(edge_item.target_id)

					next_frontier.push({
						context_id: edge_item.target_id,
						base_score: frontier_item.base_score * edge_weight,
						path_ids: next_path_ids
					})
				}
			}

			frontier = next_frontier
		}

		const score_entries = Array.from(scores.entries())

		score_entries.sort((left_item, right_item) => right_item[1] - left_item[1])

		const sequence_scores: Array<SequenceScore> = []

		for (const entry_item of score_entries) {
			sequence_scores.push({
				context_id: entry_item[0],
				score: entry_item[1]
			})
		}

		return sequence_scores
	}

	private async createContext(args: { embedding: Array<number>; keywords: Array<string> }) {
		const { embedding, keywords } = args
		const context_id = getId()
		const embedding_value = `[${embedding.join(',')}]`

		await querySql(this.p.db, sql.context.sql_insert_context, [context_id, embedding_value, keywords, 1])

		return context_id
	}

	private async updateContext(args: { context_id: string; embedding: Array<number>; keywords: Array<string> }) {
		const { context_id, embedding, keywords } = args
		const embedding_value = `[${embedding.join(',')}]`

		await querySql(this.p.db, sql.context.sql_update_context, [context_id, embedding_value, keywords])
	}

	private async updateContextTransition(args: { context_id: string | null }) {
		const { context_id } = args

		if (!context_id) return

		if (this.last_context_id && this.last_context_id !== context_id) {
			await querySql(this.p.db, sql.context.sql_upsert_context_edge, [this.last_context_id, context_id])
		}

		this.last_context_id = context_id
	}

	private async findNearestContexts(embedding: Array<number>) {
		return querySql<{ id: string; similarity: number }>(this.p.db, sql.context.sql_find_nearest_contexts, [
			`[${embedding.join(',')}]`,
			1
		])
	}

	private collectFrontierSourceIds(frontier: Array<SequenceFrontierItem>) {
		const source_ids: Array<string> = []

		for (const frontier_item of frontier) {
			source_ids.push(frontier_item.context_id)
		}

		return source_ids
	}

	private buildContextEdgeMap(edges: Array<Edge>) {
		const edge_map = new Map<string, Array<Edge>>()

		for (const edge_item of edges) {
			if (!edge_item.source_id) continue

			const edge_list = edge_map.get(edge_item.source_id) ?? []

			edge_list.push(edge_item)
			edge_map.set(edge_item.source_id, edge_list)
		}

		return edge_map
	}

	private async getContextEdgesBySources(source_ids: Array<string>, branch_limit: number) {
		if (!source_ids.length) return [] as Array<Edge>

		return querySql<Edge>(this.p.db, sql.context.sql_get_context_edges_by_sources, [source_ids, branch_limit])
	}
}
