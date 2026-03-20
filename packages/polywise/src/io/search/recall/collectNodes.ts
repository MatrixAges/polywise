import { env } from '@core/env'
import { getEmbedding } from '@core/pipeline'

interface NodeResult {
	id: string
	name: string
	rowid: number
	similarity: number
}

export default async (keywords: string) => {
	const keyword_list = keywords
		.split(',')
		.map(k => k.trim())
		.filter(Boolean)
	const placeholders = keyword_list.map(() => '?').join(',')
	const like_conditions = keyword_list.map(() => 'n.name LIKE ?').join(' OR ')
	const like_params = keyword_list.map(k => `%${k}%`)

	const name_query = `
		SELECT n.id, n.name, n.rowid
		FROM node n
		WHERE ${like_conditions}
		LIMIT 50
	`

	const name_stmt = env.sqlite.prepare(name_query)
	const name_results = name_stmt.all(...like_params) as Array<{ id: string; name: string; rowid: number }>

	const vector_text = keyword_list.join(' ')
	const vector = await getEmbedding(vector_text)
	const vector_buffer = Buffer.from(new Float32Array(vector).buffer)

	const vector_query = `
		SELECT n.id, n.name, n.rowid, distance
		FROM vec.node_vec v
		JOIN node n ON n.rowid = v.rowid
		WHERE v.vectors MATCH vec_f32(?) AND k = 50
		ORDER BY distance
	`

	const vector_stmt = env.sqlite.prepare(vector_query)
	const vector_results = vector_stmt.all(vector_buffer) as Array<{
		id: string
		name: string
		rowid: number
		distance: number
	}>

	const node_map = new Map<number, NodeResult>()

	name_results.forEach(item => {
		node_map.set(item.rowid, {
			id: item.id,
			name: item.name,
			rowid: item.rowid,
			similarity: 1.0
		})
	})

	vector_results.forEach(item => {
		const similarity = 1.0 - Math.min(item.distance, 1.0)
		const existing = node_map.get(item.rowid)
		if (!existing || similarity > existing.similarity) {
			node_map.set(item.rowid, {
				id: item.id,
				name: item.name,
				rowid: item.rowid,
				similarity
			})
		}
	})

	return Array.from(node_map.values())
}
