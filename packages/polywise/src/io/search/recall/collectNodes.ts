import { getNodeById, getNodeByName, searchEdgeByText, searchNodeByText } from '@core/db/prepare'

const normalizeSearchTerm = (value: string) => {
	return value
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s]+/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

const getSearchTerms = (kw: string) => {
	const parts = kw
		.split(',')
		.flatMap(item => normalizeSearchTerm(item).split(' '))
		.map(item => item.trim())
		.filter(Boolean)

	return Array.from(new Set(parts))
}

const getTextSearchQuery = (search_terms: Array<string>) => {
	return search_terms.map(item => `${item.replace(/"/g, '""')}*`).join(' OR ')
}

const getRankSimilarity = (index: number, floor: number) => {
	return Math.max(floor, 1 - index * 0.08)
}

const setNodeResult = (
	result_map: Map<number, { id: string; name: string; rowid: number; similarity: number }>,
	value: { id: string; name: string; rowid: number; similarity: number }
) => {
	const existing = result_map.get(value.rowid)

	if (!existing || value.similarity > existing.similarity) {
		result_map.set(value.rowid, value)
	}
}

export default async (kw: string) => {
	const search_terms = getSearchTerms(kw)

	if (!search_terms.length) {
		return []
	}

	const params = search_terms.map(item => `%${item}%`)
	const text_search_query = getTextSearchQuery(search_terms)
	const name_results = getNodeByName(search_terms.length).all(...params) as Array<{
		id: string
		name: string
		rowid: number
	}>
	const text_results = searchNodeByText().all(text_search_query) as Array<{
		id: string
		name: string
		rowid: number
		score: number
	}>
	const edge_results = searchEdgeByText().all(text_search_query) as Array<{
		id: string
		source_id: string
		target_id: string
		relation: string
		rowid: number
		score: number
	}>
	const edge_node_ids = Array.from(
		new Set(edge_results.flatMap(item => [item.source_id, item.target_id]).filter(Boolean))
	)
	const edge_nodes = edge_node_ids.length
		? (getNodeById(edge_node_ids.length).all(...edge_node_ids) as Array<{
				id: string
				name: string
				rowid: number
			}>)
		: []
	const edge_rank_map = new Map<string, number>()
	const result_map = new Map<number, { id: string; name: string; rowid: number; similarity: number }>()

	name_results.forEach((item, index) =>
		setNodeResult(result_map, {
			...item,
			similarity: getRankSimilarity(index, 0.82)
		})
	)

	text_results.forEach((item, index) =>
		setNodeResult(result_map, {
			...item,
			similarity: getRankSimilarity(index, 0.64)
		})
	)

	edge_results.forEach((item, index) => {
		const similarity = getRankSimilarity(index, 0.48)
		const source_similarity = edge_rank_map.get(item.source_id) ?? 0
		const target_similarity = edge_rank_map.get(item.target_id) ?? 0

		if (similarity > source_similarity) {
			edge_rank_map.set(item.source_id, similarity)
		}

		if (similarity > target_similarity) {
			edge_rank_map.set(item.target_id, similarity)
		}
	})

	edge_nodes.forEach(item =>
		setNodeResult(result_map, {
			...item,
			similarity: edge_rank_map.get(item.id) ?? 0.48
		})
	)

	return Array.from(result_map.values()).sort(
		(left_item, right_item) => right_item.similarity - left_item.similarity
	)
}
