import {
	sql_get_edges_between_nodes,
	sql_get_node_articles,
	sql_recall_nodes_by_label,
	sql_recall_related_nodes
} from '../sql/Brain'

import type { Edge, Node, RecallNodesByKeywordsArgs } from '../types'

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
	queryRaw: (sql: string, params?: Array<any>) => Promise<any>,
	limit = 20
) {
	// Debug log
	// console.log('[graph] recallRelatedNodes limit:', limit)

	if (node_ids.length === 0 || max_depth <= 0) {
		return []
	}

	return (await queryRaw(sql_recall_related_nodes, [node_ids, max_depth, limit])) as Array<Node>
}

export async function getEdgesBetweenNodes(
	node_ids: Array<string>,
	queryRaw: (sql: string, params?: Array<any>) => Promise<any>
) {
	if (node_ids.length < 2) {
		return []
	}

	return (await queryRaw(sql_get_edges_between_nodes, [node_ids])) as Array<Edge>
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
