function cosineSimilarity(vecA: number[], vecB: number[]) {
	const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0)
	const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0))
	const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0))
	return dotProduct / (normA * normB)
}

function generateCandidates(text: string): string[] {
	const segmenter = new Intl.Segmenter(['zh', 'en'], { granularity: 'word' })
	const segments = Array.from(segmenter.segment(text))

	const words = segments
		.filter(s => s.isWordLike)
		.map(s => s.segment.trim())
		.filter(w => w.length > 0)

	const ngrams: string[] = []

	ngrams.push(...words)

	for (let i = 0; i < words.length - 1; i++) {
		ngrams.push(`${words[i]} ${words[i + 1]}`)
	}

	return [...new Set(ngrams)]
}

const extract = async (
	text: string,
	extractor: any,
	topK: number = 5
): Promise<Array<{ word: string; score: number }>> => {
	if (!text.trim()) return []

	const candidates = generateCandidates(text)
	if (candidates.length === 0) return []

	const inputs = [text, ...candidates]

	const output = await extractor(inputs, {
		pooling: 'mean',
		normalize: true
	})

	const embeddings = output.tolist()
	const docEmbedding = embeddings[0]
	const candidateEmbeddings = embeddings.slice(1)

	const results = candidates.map((candidate, i) => {
		const score = cosineSimilarity(docEmbedding, candidateEmbeddings[i])
		return { word: candidate, score }
	})

	return results.sort((a, b) => b.score - a.score).slice(0, topK)
}

export default { extract }
