import { env } from '@core/env'
import { getEmbedding } from '@core/pipeline'
import { log } from '@core/utils'

interface SearchResult {
	chunk_id: string
	rank: number
}

export default async (text: string) => {
	const vector = await getEmbedding(text)

	log('SEARCH', 'searchByVector', () => `text: ${text.slice(0, 50)}`)

	const stmt = env.sqlite.prepare(`
		SELECT c.id as chunk_id, distance
		FROM vec.chunk_vec v
		JOIN chunk c ON c.rowid = v.rowid
		WHERE v.vectors MATCH vec_f32(?) AND k = 20
		ORDER BY distance
	`)

	const vector_buffer = Buffer.from(new Float32Array(vector).buffer)
	const results = stmt.all(vector_buffer) as Array<{ chunk_id: string; distance: number }>

	log('SEARCH', 'searchByVector results', () => `count: ${results.length}`)

	return results.map((item, index) => ({
		chunk_id: item.chunk_id,
		rank: index + 1
	})) as Array<SearchResult>
}
