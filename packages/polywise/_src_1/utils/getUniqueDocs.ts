import type { ArticleWithSimilarity, SearchCandidate } from '../types'

interface Args {
	vector_res: Array<ArticleWithSimilarity>
	fulltext_res: Array<ArticleWithSimilarity>
}

export default (args: Args) => {
	const { vector_res, fulltext_res } = args

	const candidates_map = new Map<string, SearchCandidate>()
	const content_set = new Set<string>()

	for (const r of vector_res) {
		if (candidates_map.has(r.id)) continue
		if (content_set.has(r.content)) continue

		candidates_map.set(r.id, {
			id: r.id,
			content: r.content,
			source: 'vector',
			metadata: r.metadata,
			updated_at: r.updated_at,
			context_id: r.context_id
		})
		content_set.add(r.content)
	}

	for (const r of fulltext_res) {
		if (candidates_map.has(r.id)) continue
		if (content_set.has(r.content)) continue

		candidates_map.set(r.id, {
			id: r.id,
			content: r.content,
			source: 'fulltext',
			metadata: r.metadata,
			updated_at: r.updated_at,
			context_id: r.context_id
		})
		content_set.add(r.content)
	}

	const candidates = Array.from(candidates_map.values())
	const documents = candidates.map(c => c.content)

	return { candidates, documents }
}
