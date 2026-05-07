import { keyword_search_limit } from '@core/consts/search'
import { searchChunkByKeywords } from '@core/db/prepare'
import { chunk } from '@core/db/schema'
import { getChunks } from '@core/db/services'
import { log } from '@core/utils'
import { desc, like, or } from 'drizzle-orm'

interface SearchResult {
	chunk_id: string
	rank: number
}

const escapeFtsQuery = (query: string): string => {
	return query.replace(/'/g, "''").replace(/-/g, ' ').replace(/\+/g, ' ').replace(/\*/g, ' ')
}

export default async (keywords: string) => {
	const keyword_list = keywords
		.split(',')
		.map(k => k.trim())
		.filter(Boolean)
	const query = keyword_list.join(' OR ')
	log('SEARCH', 'searchByKeywords', () => `query: ${query}`)

	const escaped_query = escapeFtsQuery(query)
	const results = searchChunkByKeywords().all(escaped_query) as Array<{ chunk_id: string; rank: number }>

	log('SEARCH', 'searchByKeywords results', () => `count: ${results.length}`)

	if (results.length > 0) {
		return results.map((item, index) => ({
			chunk_id: item.chunk_id,
			rank: index + 1
		})) as Array<SearchResult>
	}

	const content_fallback_terms = keyword_list.filter(term => term.length >= 2).slice(0, 8)

	if (content_fallback_terms.length === 0) {
		return []
	}

	const where = or(...content_fallback_terms.map(term => like(chunk.content, `%${term}%`)))
	const fallback_chunks = await getChunks({
		where,
		orderBy: desc(chunk.created_at),
		limit: keyword_search_limit
	})

	return fallback_chunks.map((item, index) => ({
		chunk_id: item.id,
		rank: index + 1
	})) as Array<SearchResult>
}
