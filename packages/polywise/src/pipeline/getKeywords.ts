// KeyBERT - https://github.com/MaartenGr/KeyBERT

import getChunkWords from './getChunkWords'
import getSimilarity from './getSimilarity'
import getVectors from './getVectors'

export default async (text: string) => {
	const candidate_list = getChunkWords(text)

	if (!candidate_list.length) return []

	const input_list = [text, ...candidate_list]

	const embedding_list = await getVectors(input_list)

	const doc_embedding = embedding_list[0]
	const candidate_embedding_list = embedding_list.slice(1)

	const result_list = candidate_list.map((word, index) => {
		const score = getSimilarity(doc_embedding, candidate_embedding_list[index])

		return { word, score }
	})

	const top_k = Math.max(6, Math.min(30, Math.round((text.length / 50) * 1.5)))

	return result_list
		.sort((a, b) => b.score - a.score)
		.slice(0, top_k)
		.map(item => item.word.trim())
}
