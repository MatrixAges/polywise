import { max_vector_distance } from '@core/consts/search'
import { searchChunkByVector } from '@core/db/prepare'
import { getEmbedding } from '@core/pipeline'
import { log } from '@core/utils'

interface SearchResult {
	chunk_id: string
	rank: number
}

export default async (text: string) => {
	const vector = await getEmbedding(text)
	log('SEARCH', 'searchByVector', () => `text: ${text.slice(0, 50)}`)

	const vector_buffer = Buffer.from(new Float32Array(vector).buffer)
	const results = searchChunkByVector().all(vector_buffer) as Array<{ chunk_id: string; distance: number }>

	const filtered = results.filter(r => r.distance < max_vector_distance)
	log('SEARCH', 'searchByVector results', () => `count: ${results.length}, filtered: ${filtered.length}`)

	return filtered.map((item, index) => ({
		chunk_id: item.chunk_id,
		rank: index + 1
	})) as Array<SearchResult>
}
