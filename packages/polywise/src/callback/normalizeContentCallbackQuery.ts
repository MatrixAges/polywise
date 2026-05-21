import { content_callback_max_query_length } from './constants'

export default (query: string) => {
	const normalized = query.replace(/\s+/g, ' ').trim()

	if (!normalized) {
		return 'empty-query'
	}

	return normalized.slice(0, content_callback_max_query_length)
}
