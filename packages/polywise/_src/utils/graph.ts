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
	const { keywords, limit = 10, idol_id, root_ids, context_id } = args

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
			context_id ?? null
		])) as Array<Node>

		results.push(...nodes)
	}

	return Array.from(new Map(results.map(n => [n.id, n])).values())
}

export async function recallRelatedNodes(args: {
	node_ids: Array<string>
	max_depth: number
	query_raw: (sql: string, params?: Array<any>) => Promise<any>
	limit?: number
	context_id?: string | null
}) {
	const { node_ids, max_depth, query_raw, limit = 20, context_id } = args

	if (node_ids.length === 0 || max_depth <= 0) {
		return []
	}

	return (await query_raw(sql_recall_related_nodes, [
		node_ids,
		max_depth,
		limit,
		context_id ?? null
	])) as Array<Node>
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
