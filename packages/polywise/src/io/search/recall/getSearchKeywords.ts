import { getKeywords } from '@core/pipeline'

export default async (query: string, intent?: string) => {
	const query_parts: Array<string | undefined> = [query, intent]
	const search_query = query_parts.filter(Boolean).join(' ')

	const keywords = await getKeywords(search_query)

	return keywords.join(', ')
}
