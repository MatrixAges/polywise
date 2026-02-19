import { STRENGTHEN_EDGE_WEIGHT } from '../consts'
import { sql_stimulate, sql_strengthen_edges_batch } from '../sql'
import { sql_get_node_articles, sql_recall_nodes_by_label, sql_recall_related_nodes } from '../sql/Brain'

import type { Node, RecallNodesByKeywordsArgs, StrengthenRelatedEdgesArgs } from '../types'

export async function recallNodesByKeywords(
	args: RecallNodesByKeywordsArgs,
	queryRaw: (sql: string, params?: any[]) => Promise<any>
) {
	const { keywords, limit = 10, idol_id, root_ids, metrics_ids } = args

	if (keywords.length === 0) {
		return []
	}

	const results: Node[] = []

	for (const keyword of keywords) {
		const nodes = (await queryRaw(sql_recall_nodes_by_label, [
			`%${keyword}%`,
			limit,
			idol_id ?? null,
			root_ids ?? null,
			metrics_ids ?? null
		])) as Array<Node>

		results.push(...nodes)
	}

	return Array.from(new Map(results.map(n => [n.id, n])).values())
}

export async function recallRelatedNodes(
	node_ids: Array<string>,
	max_depth: number,
	queryRaw: (sql: string, params?: Array<any>) => Promise<any>
) {
	if (node_ids.length === 0 || max_depth <= 0) {
		return []
	}

	return (await queryRaw(sql_recall_related_nodes, [node_ids, max_depth, 20])) as Array<Node>
}

export async function getNodeContexts(
	node_ids: Array<string>,
	queryRaw: (sql: string, params?: Array<any>) => Promise<any>
) {
	if (node_ids.length === 0) {
		return []
	}

	const articles = (await queryRaw(sql_get_node_articles, [node_ids])) as Array<any>

	return articles.map(article => ({
		article_ids: [article.id],
		relevance_score: 1.0
	}))
}

export async function stimulateNodes(
	node_ids: Array<string>,
	intensity: number,
	queryRaw: (sql: string, params?: Array<any>) => Promise<any>
) {
	if (node_ids.length === 0 || intensity <= 0) {
		return
	}

	for (const id of node_ids) {
		await queryRaw(sql_stimulate, [intensity, id])
	}
}

export async function strengthenRelatedEdges(
	args: StrengthenRelatedEdgesArgs,
	queryRaw: (sql: string, params?: any[]) => Promise<any>
) {
	const { matched_nodes, related_nodes } = args
	const node_ids = [...matched_nodes, ...related_nodes].map(n => n.id)

	if (node_ids.length < 2) {
		return
	}

	await queryRaw(sql_strengthen_edges_batch, [STRENGTHEN_EDGE_WEIGHT, node_ids, node_ids])
}
