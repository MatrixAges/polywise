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
import ensureContentCenterNode from './ensureContentCenterNode'
import resolveContentArticleNodes from './resolveContentArticleNodes'

const clamp = (value: number, min: number, max: number) => {
	return Math.min(max, Math.max(min, value))
}

type ScopeItem = {
	agent_id: string | null
	center_node_id: string
	hit_node_ids: Array<string>
	miss_node_ids: Array<string>
}

const scopeKeyOf = (agent_id: string | null) => agent_id ?? 'global'

const collectScopeNodes = (map: Awaited<ReturnType<typeof resolveContentArticleNodes>>) => {
	const target = new Map<string, { agent_id: string | null; node_ids: Set<string> }>()

	for (const node_refs of map.values()) {
		for (const node_ref of node_refs) {
			if (node_ref.is_frozen) {
				continue
			}

			const scope_key = scopeKeyOf(node_ref.agent_id)

			if (!target.has(scope_key)) {
				target.set(scope_key, {
					agent_id: node_ref.agent_id,
					node_ids: new Set()
				})
			}

			target.get(scope_key)?.node_ids.add(node_ref.node_id)
		}
	}

	return target
}

interface ApplyContentGraphFeedbackArgs {
	center_node_id: string
	query: string
	hit_article_ids: Array<string>
	miss_article_ids: Array<string>
}

export default async (args: ApplyContentGraphFeedbackArgs) => {
	const { center_node_id, query, hit_article_ids, miss_article_ids } = args
	const [hit_node_map, miss_node_map] = await Promise.all([
		resolveContentArticleNodes(hit_article_ids),
		resolveContentArticleNodes(miss_article_ids)
	])
	const hit_scope_map = collectScopeNodes(hit_node_map)
	const miss_scope_map = collectScopeNodes(miss_node_map)
	const scope_items = [] as Array<ScopeItem>

	for (const [scope_key, hit_scope] of hit_scope_map) {
		const miss_scope = miss_scope_map.get(scope_key)

		scope_items.push({
			agent_id: hit_scope.agent_id,
			center_node_id:
				hit_scope.agent_id === null
					? center_node_id
					: (await ensureContentCenterNode(query, hit_scope.agent_id)).center_node_id,
			hit_node_ids: Array.from(hit_scope.node_ids),
			miss_node_ids: Array.from(miss_scope?.node_ids ?? []).filter(
				node_id => !hit_scope.node_ids.has(node_id)
			)
		})
	}

	const now = Date.now()
	const hit_node_list = scope_items.flatMap(item => item.hit_node_ids)
	const miss_node_list = scope_items.flatMap(item => item.miss_node_ids)
	const run = env.sqlite.transaction(() => {
		const hit_article_scope_stmt = hit_article_ids.length
			? env.sqlite.prepare(
					`
					SELECT a.id, a.scope_type, ag.is_frozen AS agent_is_frozen
					FROM article a
					LEFT JOIN agent ag ON a.scope_type = 'agent' AND a.scope_id = ag.id
					WHERE a.id IN (${hit_article_ids.map(() => '?').join(', ')})
				`
				)
			: null
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
		const getEdge = env.sqlite.prepare(`
			SELECT id, weight, growth, confidence, bandwidth
			FROM edge
			WHERE source_id = ? AND target_id = ? AND ((? is null AND agent_id is null) OR agent_id = ?)
			LIMIT 1
		`)
		const insertEdge = env.sqlite.prepare(`
			INSERT OR IGNORE INTO edge (
				id, relation, agent_id, source_id, target_id,
				weight, growth, confidence, distance, bandwidth,
				active_times, active_at, is_frozen, created_at
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1.0, ?, 1, ?, 0, ?)
		`)
		const strengthenEdge = env.sqlite.prepare(`
			UPDATE edge
			SET weight = ?,
				confidence = ?,
				bandwidth = ?,
				active_times = coalesce(active_times, 0) + 1,
				active_at = ?
			WHERE id = ?
		`)
		const weakenEdge = env.sqlite.prepare(`
			UPDATE edge
			SET weight = ?,
				confidence = ?,
				bandwidth = ?,
				active_at = ?
			WHERE id = ?
		`)

		const writable_hit_article_ids = hit_article_scope_stmt
			? (
					hit_article_scope_stmt.all(...hit_article_ids) as Array<{
						id: string
						scope_type: string | null
						agent_is_frozen: number | null
					}>
				)
					.filter(row => !(row.scope_type === 'agent' && row.agent_is_frozen))
					.map(row => row.id)
			: []

		for (const article_id of writable_hit_article_ids) {
			touch_article.run(now, article_id)
		}

		for (const scope_item of scope_items) {
			if (scope_item.hit_node_ids.length > 0) {
				touch_node.run(
					now,
					content_callback_node_level_step,
					content_callback_node_sens_step,
					scope_item.center_node_id
				)
			}

			for (const node_id of scope_item.hit_node_ids) {
				touch_node.run(now, content_callback_node_level_step, content_callback_node_sens_step, node_id)

				const edge_row = getEdge.get(
					scope_item.center_node_id,
					node_id,
					scope_item.agent_id,
					scope_item.agent_id
				) as
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
					insertEdge.run(
						getId(),
						content_callback_relation,
						scope_item.agent_id,
						scope_item.center_node_id,
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

				strengthenEdge.run(
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

			for (const node_id of scope_item.miss_node_ids) {
				const edge_row = getEdge.get(
					scope_item.center_node_id,
					node_id,
					scope_item.agent_id,
					scope_item.agent_id
				) as
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

				weakenEdge.run(
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
		}
	})

	run()

	return {
		hit_article_count: hit_article_ids.length,
		miss_article_count: miss_article_ids.length,
		hit_node_count: hit_node_list.length,
		miss_node_count: miss_node_list.length,
		hit_node_ids: hit_node_list,
		miss_node_ids: miss_node_list,
		global_scope: scope_items.find(item => item.agent_id === null) ?? null,
		agent_scopes: scope_items.filter(
			(item): item is ScopeItem & { agent_id: string } => typeof item.agent_id === 'string'
		)
	}
}
