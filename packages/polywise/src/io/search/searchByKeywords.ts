import { env } from '@core/env'
import { log } from '@core/utils'

interface SearchResult {
	chunk_id: string
	rank: number
}

const escapeFtsQuery = (query: string): string => {
	return query.replace(/'/g, "''").replace(/-/g, ' ').replace(/\+/g, ' ').replace(/\*/g, ' ')
}

export default async (keywords: string) => {
	const query = keywords
		.split(',')
		.map(k => k.trim())
		.filter(Boolean)
		.join(' OR ')

	log('SEARCH', 'searchByKeywords', () => `query: ${query}`)

	const escaped_query = escapeFtsQuery(query)

	const stmt = env.sqlite.prepare(`
		SELECT c.id as chunk_id, rank
		FROM chunk_keywords_fts fts
		JOIN chunk c ON c.rowid = fts.rowid
		WHERE chunk_keywords_fts MATCH ?
		ORDER BY rank
		LIMIT 20
	`)

	const results = stmt.all(escaped_query) as Array<{ chunk_id: string; rank: number }>

	log('SEARCH', 'searchByKeywords results', () => `count: ${results.length}`)

	return results.map((item, index) => ({
		chunk_id: item.chunk_id,
		rank: index + 1
	})) as Array<SearchResult>
}
