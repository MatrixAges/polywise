import { describe, expect, it } from '@rstest/core'

import { aggregateResults } from '../src/utils/aggregation'

import type { RecallResult, SearchResult } from '../src/types'

describe.concurrent('Temporal recency weighting', () => {
	it('should weight recent memories higher than stale ones', async () => {
		const now = Date.now()
		const recent_at = new Date(now).toISOString()
		const stale_at = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString()

		const recall_result: RecallResult = {
			nodes: [],
			edges: [],
			stimulated_nodes: [],
			related_contexts: [
				{ relevance_score: 1.0, article_ids: ['recent'] },
				{ relevance_score: 1.0, article_ids: ['stale'] }
			]
		}

		const search_results: Array<SearchResult> = [
			{
				id: 'recent',
				content: 'recent context',
				source: 'vector',
				rerankScore: 0.5,
				updated_at: recent_at
			},
			{
				id: 'stale',
				content: 'stale context',
				source: 'vector',
				rerankScore: 0.5,
				updated_at: stale_at
			}
		]

		const result = await aggregateResults({ recall_result, search_results })
		const recent_memory = result.memory.find(item => item.id === 'recent')
		const stale_memory = result.memory.find(item => item.id === 'stale')

		expect(recent_memory?.memoryStrength).toBeGreaterThan(stale_memory?.memoryStrength ?? 0)
	})
})
