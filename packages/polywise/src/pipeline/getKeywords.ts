import getChunkWords from './getChunkWords'

export default async (text: string) => {
	const candidate_list = (await getChunkWords(text)).map(item => item.trim()).filter(Boolean)

	if (!candidate_list.length) return []

	const normalized_candidate_list = candidate_list.map((word, index) => ({
		word,
		index,
		normalized: word.toLowerCase().replace(/\s+/g, ' ').trim()
	}))

	const top_k = Math.max(12, Math.min(60, Math.round((text.length / 40) * 2.5)))

	const sorted_list = normalized_candidate_list.sort((a, b) => b.word.length - a.word.length || a.index - b.index)
	const filtered_list: Array<(typeof normalized_candidate_list)[number]> = []

	for (const item of sorted_list) {
		const is_similar = filtered_list.some(selected => {
			return item.normalized.includes(selected.normalized) || selected.normalized.includes(item.normalized)
		})

		if (!is_similar) {
			filtered_list.push(item)

			if (filtered_list.length >= top_k) break
		}
	}

	return filtered_list.map(item => item.word)
}
