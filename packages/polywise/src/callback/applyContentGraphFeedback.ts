import { env } from '@core/env'
import { getId } from 'stk/utils'

import {
	content_callback_bandwidth_floor,
	content_callback_bandwidth_penalty,
	content_callback_bandwidth_step,
	content_callback_confidence_penalty,
	content_callback_confidence_step,
	content_callback_learning_rate,
	content_callback_miss_factor,
	content_callback_node_level_step,
	content_callback_node_sens_step,
	content_callback_relation,
	content_callback_weight_floor
} from './constants'
import resolveContentArticleNodes from './resolveContentArticleNodes'

const clamp = (value: number, min: number, max: number) => {
	return Math.min(max, Math.max(min, value))
}

const flattenNodeMap = (map: Map<string, Set<string>>) => {
	const ids = new Set<string>()

	for (const node_ids of map.values()) {
		for (const node_id of node_ids) {
			ids.add(node_id)
		}
	}

	return ids
}

interface ApplyContentGraphFeedbackArgs {
	center_node_id: string
	hit_article_ids: Array<string>
	miss_article_ids: Array<string>
}

export default async (args: ApplyContentGraphFeedbackArgs) => {
	const { center_node_id, hit_article_ids, miss_article_ids } = args
	const [hit_node_map, miss_node_map] = await Promise.all([
		resolveContentArticleNodes(hit_article_ids),
		resolveContentArticleNodes(miss_article_ids)
	])
	const hit_node_ids = flattenNodeMap(hit_node_map)
	const miss_node_ids = flattenNodeMap(miss_node_map)

	for (const node_id of hit_node_ids) {
		miss_node_ids.delete(node_id)
	}

	const now = Date.now()
	const hit_node_list = [...hit_node_ids]
	const miss_node_list = [...miss_node_ids]
	const run = env.sqlite.transaction(() => {
		const touch_article = env.sqlite.prepare(`
			UPDATE article
			SET hit_count = coalesce(hit_count, 0) + 1,
				hit_at = ?
			WHERE id = ?
		`)
		const touch_node = env.sqlite.prepare(`
			UPDATE node
			SET active_times = coalesce(active_times, 0) + 1,
				active_at = ?,
				active_level = min(1.0, coalesce(active_level, 0.0) + ?),
				active_sens = min(1.0, coalesce(active_sens, 0.0) + ?)
			WHERE id = ?
		`)
		const get_edge = env.sqlite.prepare(`
			SELECT id, weight, growth, confidence, bandwidth
			FROM edge
			WHERE source_id = ? AND target_id = ?
			LIMIT 1
		`)
		const insert_edge = env.sqlite.prepare(`
			INSERT OR IGNORE INTO edge (
				id, relation, agent_id, source_id, target_id,
				weight, growth, confidence, distance, bandwidth,
				active_times, active_at, is_frozen, created_at
			)
			VALUES (?, ?, null, ?, ?, ?, ?, ?, 1.0, ?, 1, ?, 0, ?)
		`)
		const strengthen_edge = env.sqlite.prepare(`
			UPDATE edge
			SET weight = ?,
				confidence = ?,
				bandwidth = ?,
				active_times = coalesce(active_times, 0) + 1,
				active_at = ?
			WHERE id = ?
		`)
		const weaken_edge = env.sqlite.prepare(`
			UPDATE edge
			SET weight = ?,
				confidence = ?,
				bandwidth = ?,
				active_at = ?
			WHERE id = ?
		`)

		for (const article_id of hit_article_ids) {
			touch_article.run(now, article_id)
		}

		if (hit_article_ids.length > 0) {
			touch_node.run(now, content_callback_node_level_step, content_callback_node_sens_step, center_node_id)
		}

		for (const node_id of hit_node_list) {
			touch_node.run(now, content_callback_node_level_step, content_callback_node_sens_step, node_id)

			const edge_row = get_edge.get(center_node_id, node_id) as
				| {
						id: string
						weight: number | null
						growth: number | null
						confidence: number | null
						bandwidth: number | null
				  }
				| undefined
			const growth = Math.max(0.25, Number(edge_row?.growth ?? 1))
			const delta_weight = content_callback_learning_rate * growth

			if (!edge_row) {
				insert_edge.run(
					getId(),
					content_callback_relation,
					center_node_id,
					node_id,
					1 + delta_weight,
					1.0,
					clamp(0.5 + content_callback_confidence_step, 0, 1),
					1 + content_callback_bandwidth_step,
					now,
					now
				)
				continue
			}

			strengthen_edge.run(
				Math.max(content_callback_weight_floor, Number(edge_row.weight ?? 1) + delta_weight),
				clamp(Number(edge_row.confidence ?? 0.5) + content_callback_confidence_step, 0, 1),
				Math.max(
					content_callback_bandwidth_floor,
					Number(edge_row.bandwidth ?? 1) + content_callback_bandwidth_step
				),
				now,
				edge_row.id
			)
		}

		for (const node_id of miss_node_list) {
			const edge_row = get_edge.get(center_node_id, node_id) as
				| {
						id: string
						weight: number | null
						growth: number | null
						confidence: number | null
						bandwidth: number | null
				  }
				| undefined

			if (!edge_row) {
				continue
			}

			const growth = Math.max(0.25, Number(edge_row.growth ?? 1))
			const delta_weight = content_callback_learning_rate * growth * content_callback_miss_factor

			weaken_edge.run(
				Math.max(content_callback_weight_floor, Number(edge_row.weight ?? 1) - delta_weight),
				clamp(Number(edge_row.confidence ?? 0.5) - content_callback_confidence_penalty, 0, 1),
				Math.max(
					content_callback_bandwidth_floor,
					Number(edge_row.bandwidth ?? 1) - content_callback_bandwidth_penalty
				),
				now,
				edge_row.id
			)
		}
	})

	run()

	return {
		hit_article_count: hit_article_ids.length,
		miss_article_count: miss_article_ids.length,
		hit_node_count: hit_node_list.length,
		miss_node_count: miss_node_list.length,
		hit_node_ids: hit_node_list,
		miss_node_ids: miss_node_list
	}
}
