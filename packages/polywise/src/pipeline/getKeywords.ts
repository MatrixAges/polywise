// KeyBERT - https://github.com/MaartenGr/KeyBERT

import getChunkWords from './getChunkWords'
import getSimilarity from './getSimilarity'
import getVectors from './getVectors'

export default async (text: string) => {
	const candidate_list = await getChunkWords(text)

	if (!candidate_list.length) return []

	const input_list = [text, ...candidate_list]

	const embedding_list = await getVectors(input_list)

	const doc_embedding = embedding_list[0]
	const candidate_embedding_list = embedding_list.slice(1)

	const result_list = candidate_list.map((word, index) => {
		const score = getSimilarity(doc_embedding, candidate_embedding_list[index])
		const vector = candidate_embedding_list[index]

		return { word, score, vector }
	})

	const top_k = Math.max(8, Math.min(40, Math.round((text.length / 40) * 2)))

	const sorted_list = result_list.sort((a, b) => b.score - a.score)
	const filtered_list: Array<{ word: string; score: number; vector: Array<number> }> = []

	for (const item of sorted_list) {
		const is_similar = filtered_list.some(selected => {
			const is_text_similar = item.word.includes(selected.word) || selected.word.includes(item.word)
			const is_vec_similar = getSimilarity(item.vector, selected.vector) > 0.85

			return is_text_similar || is_vec_similar
		})

		if (!is_similar) {
			filtered_list.push(item)

			if (filtered_list.length >= top_k) break
		}
	}

	return filtered_list.map(item => item.word.trim())
}
