import { getKeywords } from '@core/pipeline'

export default async (query: string, intent?: string) => {
	const combined_query = [query, intent].filter(Boolean).join(' ').trim()
	const keywords_list = await getKeywords(combined_query)
	return keywords_list.join(', ')
}
