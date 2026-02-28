import cosineSimilarity from './cosineSimilarity'

export function normalizeScores<T extends { score: number }>(items: Array<T>): Array<T & { normalizedScore: number }> {
	if (items.length === 0) return []

	const maxScore = Math.max(...items.map(d => d.score))
	const minScore = Math.min(...items.map(d => d.score))

	return items.map(item => ({
		...item,
		normalizedScore: maxScore === minScore ? 1 : (item.score - minScore) / (maxScore - minScore)
	}))
}

export default <T extends { score: number; embedding?: Array<number> }>(
	candidates: Array<T>,
	topK = 5,
	lambda = 0.5
): Array<T> => {
	if (candidates.length === 0) return []

	const unselected = normalizeScores(candidates)
	const selected: Array<(typeof unselected)[0]> = []

	unselected.sort((a, b) => b.normalizedScore - a.normalizedScore)
	selected.push(unselected.shift()!)

	while (selected.length < topK && unselected.length > 0) {
		let bestScore = -Infinity
		let bestIndex = -1

		for (let i = 0; i < unselected.length; i++) {
			const candidate = unselected[i]
			let maxSimilarityToSelected = -Infinity

			if (!candidate.embedding || candidate.embedding.length === 0) {
				maxSimilarityToSelected = 0
			} else {
				for (let j = 0; j < selected.length; j++) {
					const selected_embedding = selected[j].embedding
					if (!selected_embedding || selected_embedding.length === 0) continue

					const sim = cosineSimilarity(candidate.embedding, selected_embedding)
					if (sim > maxSimilarityToSelected) {
						maxSimilarityToSelected = sim
					}
				}
			}

			if (maxSimilarityToSelected === -Infinity) {
				maxSimilarityToSelected = 0
			}

			const mmrScore = lambda * candidate.normalizedScore - (1 - lambda) * maxSimilarityToSelected

			if (mmrScore > bestScore) {
				bestScore = mmrScore
				bestIndex = i
			}
		}

		selected.push(unselected[bestIndex])
		unselected.splice(bestIndex, 1)
	}

	return selected
}
