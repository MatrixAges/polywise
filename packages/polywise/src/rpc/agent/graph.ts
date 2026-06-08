import { article, chunk, edge, edge_article, node, node_chunk } from '@core/db/schema'
import { env } from '@core/env'
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'

const default_node_limit = 18
const default_expand_limit = 12
const default_chunk_limit = 8
const default_article_limit = 8
const max_visible_node_count = 80

export interface ReadAgentGraphArgs {
	agent_id: string
	center_node_id?: string
	expand?: boolean
	visible_node_ids?: Array<string>
}

export interface AgentGraphNode {
	id: string
	name: string
	active_level: number
	active_times: number
	is_frozen: boolean
	degree: number
	chunk_count: number
	article_count: number
}

export interface AgentGraphEdge {
	id: string
	source_id: string
	target_id: string
	relation: string
	weight: number
	confidence: number
	state: string
	is_frozen: boolean
	article_count: number
}

export interface AgentGraphArticle {
	id: string
	title: string
	content: string
	for_type: string
	scope_type: string | null
	updated_at: Date | null
}

export interface AgentGraphChunk {
	id: string
	content: string
	position: number | null
	article_id: string
	article_title: string
	article_for: string
}

export interface AgentGraphSelectedNode {
	id: string
	name: string
	hidden_neighbor_count: number
	articles: Array<AgentGraphArticle>
	chunks: Array<AgentGraphChunk>
}

export interface AgentGraphSnapshot {
	nodes: Array<AgentGraphNode>
	edges: Array<AgentGraphEdge>
	selected_node_id: string
	selected_node: AgentGraphSelectedNode | null
	total_node_count: number
	total_edge_count: number
}

const getUniqueIds = (values: Array<string>, limit = max_visible_node_count) => {
	const result = [] as Array<string>
	const seen_ids = new Set<string>()

	for (const value of values) {
		if (!value || seen_ids.has(value)) {
			continue
		}

		seen_ids.add(value)
		result.push(value)

		if (result.length >= limit) {
			break
		}
	}

	return result
}

const getEdgeScore = (item: {
	weight: number
	confidence: number
	active_times: number
	stability: number
	rewire_score: number
}) => {
	return item.weight * 4 + item.confidence * 3 + item.active_times * 0.12 + item.stability * 1.5 + item.rewire_score
}

const getNodeScore = (item: { active_times: number; active_level: number; created_at: Date | null }) => {
	return item.active_times * 0.2 + item.active_level * 4 + (item.created_at?.getTime() ?? 0) / 1_000_000_000_000
}

const getInitialVisibleNodeIds = async (agent_id: string) => {
	const [top_edges, top_nodes] = await Promise.all([
		env.db
			.select()
			.from(edge)
			.where(eq(edge.agent_id, agent_id))
			.orderBy(desc(edge.weight), desc(edge.confidence), desc(edge.active_times), desc(edge.created_at))
			.limit(default_node_limit * 2),
		env.db
			.select()
			.from(node)
			.where(eq(node.agent_id, agent_id))
			.orderBy(desc(node.active_times), desc(node.active_level), desc(node.created_at))
			.limit(default_node_limit * 2)
	])

	const seed_node_ids = top_edges.flatMap(item => [item.source_id, item.target_id])
	const fallback_node_ids = top_nodes
		.sort((left_item, right_item) => getNodeScore(right_item) - getNodeScore(left_item))
		.map(item => item.id)

	return getUniqueIds(seed_node_ids.concat(fallback_node_ids), default_node_limit)
}

const getVisibleNodeIds = async (args: ReadAgentGraphArgs) => {
	const { agent_id, center_node_id, expand, visible_node_ids = [] } = args
	const next_visible_ids = getUniqueIds(visible_node_ids)

	if (!center_node_id) {
		return next_visible_ids.length > 0 ? next_visible_ids : getInitialVisibleNodeIds(agent_id)
	}

	if (next_visible_ids.length === 0) {
		next_visible_ids.push(center_node_id)
	}

	if (!next_visible_ids.includes(center_node_id)) {
		next_visible_ids.unshift(center_node_id)
	}

	if (!expand) {
		return getUniqueIds(next_visible_ids)
	}

	const neighbor_edges = await env.db
		.select()
		.from(edge)
		.where(
			and(
				eq(edge.agent_id, agent_id),
				or(eq(edge.source_id, center_node_id), eq(edge.target_id, center_node_id))
			)
		)
		.orderBy(desc(edge.weight), desc(edge.confidence), desc(edge.active_times), desc(edge.created_at))
		.limit(default_expand_limit * 4)

	const next_neighbor_ids = neighbor_edges
		.sort((left_item, right_item) => getEdgeScore(right_item) - getEdgeScore(left_item))
		.map(item => (item.source_id === center_node_id ? item.target_id : item.source_id))
		.filter(item => !next_visible_ids.includes(item))
		.slice(0, default_expand_limit)

	return getUniqueIds(next_visible_ids.concat(next_neighbor_ids))
}

const getVisibleNodes = async (visible_node_ids: Array<string>) => {
	if (visible_node_ids.length === 0) {
		return []
	}

	return env.db
		.select()
		.from(node)
		.where(inArray(node.id, visible_node_ids))
		.then(rows => rows.sort((left_item, right_item) => getNodeScore(right_item) - getNodeScore(left_item)))
}

const getVisibleEdges = async (args: { agent_id: string; visible_node_ids: Array<string> }) => {
	const { agent_id, visible_node_ids } = args

	if (visible_node_ids.length === 0) {
		return []
	}

	return env.db
		.select()
		.from(edge)
		.where(
			and(
				eq(edge.agent_id, agent_id),
				inArray(edge.source_id, visible_node_ids),
				inArray(edge.target_id, visible_node_ids)
			)
		)
		.then(rows => rows.sort((left_item, right_item) => getEdgeScore(right_item) - getEdgeScore(left_item)))
}

const getNodeChunkRows = async (visible_node_ids: Array<string>) => {
	if (visible_node_ids.length === 0) {
		return []
	}

	return env.db.select().from(node_chunk).where(inArray(node_chunk.node_id, visible_node_ids))
}

const getVisibleChunkRows = async (chunk_ids: Array<string>) => {
	if (chunk_ids.length === 0) {
		return []
	}

	return env.db
		.select({
			id: chunk.id,
			article_id: chunk.article_id
		})
		.from(chunk)
		.where(inArray(chunk.id, chunk_ids))
}

const getEdgeArticleRows = async (edge_ids: Array<string>) => {
	if (edge_ids.length === 0) {
		return []
	}

	return env.db.select().from(edge_article).where(inArray(edge_article.edge_id, edge_ids))
}

const buildNodeArticleMap = (args: {
	node_rows: Awaited<ReturnType<typeof getVisibleNodes>>
	edge_rows: Awaited<ReturnType<typeof getVisibleEdges>>
	node_chunk_rows: Awaited<ReturnType<typeof getNodeChunkRows>>
	chunk_rows: Awaited<ReturnType<typeof getVisibleChunkRows>>
	edge_article_rows: Awaited<ReturnType<typeof getEdgeArticleRows>>
}) => {
	const { node_rows, edge_rows, node_chunk_rows, chunk_rows, edge_article_rows } = args
	const node_article_ids_map = new Map<string, Set<string>>()
	const chunk_article_id_map = new Map(chunk_rows.map(item => [item.id, item.article_id || '']))
	const edge_article_ids_map = new Map<string, Array<string>>()

	for (const item of edge_article_rows) {
		const article_ids = edge_article_ids_map.get(item.edge_id) ?? []

		article_ids.push(item.article_id)
		edge_article_ids_map.set(item.edge_id, article_ids)
	}

	for (const item of node_rows) {
		node_article_ids_map.set(item.id, new Set<string>())
	}

	for (const item of node_chunk_rows) {
		const article_id = chunk_article_id_map.get(item.chunk_id)

		if (!article_id) {
			continue
		}

		node_article_ids_map.get(item.node_id)?.add(article_id)
	}

	for (const item of edge_rows) {
		const article_ids = edge_article_ids_map.get(item.id) ?? []

		for (const article_id of article_ids) {
			node_article_ids_map.get(item.source_id)?.add(article_id)
			node_article_ids_map.get(item.target_id)?.add(article_id)
		}
	}

	return node_article_ids_map
}

const buildGraphNodes = (args: {
	node_rows: Awaited<ReturnType<typeof getVisibleNodes>>
	edge_rows: Awaited<ReturnType<typeof getVisibleEdges>>
	node_chunk_rows: Awaited<ReturnType<typeof getNodeChunkRows>>
	node_article_ids_map: Map<string, Set<string>>
}) => {
	const { node_rows, edge_rows, node_chunk_rows, node_article_ids_map } = args
	const node_degree_map = new Map<string, number>()
	const node_chunk_count_map = new Map<string, number>()

	for (const item of edge_rows) {
		node_degree_map.set(item.source_id, (node_degree_map.get(item.source_id) ?? 0) + 1)
		node_degree_map.set(item.target_id, (node_degree_map.get(item.target_id) ?? 0) + 1)
	}

	for (const item of node_chunk_rows) {
		node_chunk_count_map.set(item.node_id, (node_chunk_count_map.get(item.node_id) ?? 0) + 1)
	}

	return node_rows.map(item => ({
		id: item.id,
		name: item.name,
		active_level: item.active_level,
		active_times: item.active_times,
		is_frozen: item.is_frozen,
		degree: node_degree_map.get(item.id) ?? 0,
		chunk_count: node_chunk_count_map.get(item.id) ?? 0,
		article_count: node_article_ids_map.get(item.id)?.size ?? 0
	}))
}

const buildGraphEdges = (args: {
	edge_rows: Awaited<ReturnType<typeof getVisibleEdges>>
	edge_article_rows: Awaited<ReturnType<typeof getEdgeArticleRows>>
}) => {
	const { edge_rows, edge_article_rows } = args
	const edge_article_count_map = new Map<string, number>()

	for (const item of edge_article_rows) {
		edge_article_count_map.set(item.edge_id, (edge_article_count_map.get(item.edge_id) ?? 0) + 1)
	}

	return edge_rows.map(item => ({
		id: item.id,
		source_id: item.source_id,
		target_id: item.target_id,
		relation: item.relation,
		weight: item.weight,
		confidence: item.confidence,
		state: item.state,
		is_frozen: item.is_frozen,
		article_count: edge_article_count_map.get(item.id) ?? 0
	}))
}

const getNodeDetails = async (args: { agent_id: string; center_node_id: string; visible_node_ids: Array<string> }) => {
	const { agent_id, center_node_id, visible_node_ids } = args
	const [selected_node_row, neighbor_edges, chunk_rows] = await Promise.all([
		env.db
			.select()
			.from(node)
			.where(and(eq(node.agent_id, agent_id), eq(node.id, center_node_id)))
			.limit(1)
			.then(rows => rows[0] ?? null),
		env.db
			.select()
			.from(edge)
			.where(
				and(
					eq(edge.agent_id, agent_id),
					or(eq(edge.source_id, center_node_id), eq(edge.target_id, center_node_id))
				)
			)
			.orderBy(desc(edge.weight), desc(edge.confidence), desc(edge.active_times), desc(edge.created_at))
			.limit(default_expand_limit * 4),
		env.db
			.select({
				chunk_id: chunk.id,
				content: chunk.content,
				position: chunk.position,
				article_id: article.id,
				article_title: article.title,
				article_for: article.for
			})
			.from(node_chunk)
			.innerJoin(chunk, eq(node_chunk.chunk_id, chunk.id))
			.innerJoin(article, eq(chunk.article_id, article.id))
			.where(eq(node_chunk.node_id, center_node_id))
			.orderBy(desc(article.updated_at), desc(chunk.created_at))
			.limit(default_chunk_limit)
	])

	if (!selected_node_row) {
		return null
	}

	const incident_edge_ids = neighbor_edges.map(item => item.id)
	const related_edge_article_rows = await getEdgeArticleRows(incident_edge_ids)
	const edge_article_ids = getUniqueIds(
		related_edge_article_rows.map(item => item.article_id),
		default_article_limit * 4
	)
	const chunk_article_ids = getUniqueIds(
		chunk_rows.map(item => item.article_id),
		default_article_limit * 2
	)
	const related_article_ids = getUniqueIds(chunk_article_ids.concat(edge_article_ids), default_article_limit * 3)
	const related_articles =
		related_article_ids.length > 0
			? await env.db
					.select()
					.from(article)
					.where(inArray(article.id, related_article_ids))
					.then(rows =>
						rows.sort(
							(left_item, right_item) =>
								(right_item.updated_at?.getTime() ?? 0) -
								(left_item.updated_at?.getTime() ?? 0)
						)
					)
			: []
	const visible_node_id_set = new Set(visible_node_ids)
	const hidden_neighbor_count = getUniqueIds(
		neighbor_edges.map(item => (item.source_id === center_node_id ? item.target_id : item.source_id))
	).filter(item => !visible_node_id_set.has(item)).length

	return {
		id: selected_node_row.id,
		name: selected_node_row.name,
		hidden_neighbor_count,
		articles: related_articles.slice(0, default_article_limit).map(item => ({
			id: item.id,
			title: item.title || '',
			content: item.content,
			for_type: item.for,
			scope_type: item.scope_type,
			updated_at: item.updated_at
		})),
		chunks: chunk_rows.map(item => ({
			id: item.chunk_id,
			content: item.content || '',
			position: item.position,
			article_id: item.article_id,
			article_title: item.article_title || '',
			article_for: item.article_for
		}))
	}
}

const getCount = async (table: typeof node | typeof edge, where: ReturnType<typeof eq>) => {
	const row = await env.db
		.select({ count: sql<number>`count(*)` })
		.from(table)
		.where(where)
		.then(rows => rows[0] ?? null)

	return Number(row?.count ?? 0)
}

export const readAgentGraph = async (args: ReadAgentGraphArgs): Promise<AgentGraphSnapshot> => {
	const visible_node_ids = await getVisibleNodeIds(args)
	const [total_node_count, total_edge_count, node_rows, edge_rows] = await Promise.all([
		getCount(node, eq(node.agent_id, args.agent_id)),
		getCount(edge, eq(edge.agent_id, args.agent_id)),
		getVisibleNodes(visible_node_ids),
		getVisibleEdges({ agent_id: args.agent_id, visible_node_ids })
	])
	const node_chunk_rows = await getNodeChunkRows(node_rows.map(item => item.id))
	const chunk_rows = await getVisibleChunkRows(node_chunk_rows.map(item => item.chunk_id))
	const edge_article_rows = await getEdgeArticleRows(edge_rows.map(item => item.id))
	const node_article_ids_map = buildNodeArticleMap({
		node_rows,
		edge_rows,
		node_chunk_rows,
		chunk_rows,
		edge_article_rows
	})
	const nodes = buildGraphNodes({
		node_rows,
		edge_rows,
		node_chunk_rows,
		node_article_ids_map
	})
	const edges = buildGraphEdges({ edge_rows, edge_article_rows })
	const selected_node_ids = new Set(nodes.map(item => item.id))
	const selected_node_id =
		args.center_node_id && selected_node_ids.has(args.center_node_id)
			? args.center_node_id
			: (nodes[0]?.id ?? '')
	const selected_node = selected_node_id
		? await getNodeDetails({
				agent_id: args.agent_id,
				center_node_id: selected_node_id,
				visible_node_ids: node_rows.map(item => item.id)
			})
		: null

	return {
		nodes,
		edges,
		selected_node_id,
		selected_node,
		total_node_count,
		total_edge_count
	}
}
