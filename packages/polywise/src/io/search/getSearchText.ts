const generic_intent_set = new Set(['knowledge search', 'memory search'])

export const normalizeIntentForSearch = (intent?: string) => {
	const normalized = intent?.trim()

	if (!normalized) return ''
	if (generic_intent_set.has(normalized.toLowerCase())) return ''

	return normalized
}

export default (query: string, intent?: string) => {
	const normalized_query = query.trim()
	const normalized_intent = normalizeIntentForSearch(intent)

	return [normalized_query, normalized_intent].filter(Boolean).join(' ').trim()
}
