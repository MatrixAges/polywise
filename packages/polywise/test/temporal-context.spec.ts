import { describe, expect, it } from '@rstest/core'

import { aggregateResults } from '../src/utils/aggregation'
import { cognitive_science_datasets } from './datasets/cognitive'
import { software_architecture_datasets } from './datasets/software'

import type { RecallResult, SearchResult } from '../src/types'

describe.concurrent('Temporal context sequencing', () => {
	it('should boost memory strength for sequence context', async () => {
		const now = new Date().toISOString()

		const search_results: Array<SearchResult> = [
			{
				id: 'article_a',
				content: software_architecture_datasets[0],
				source: 'vector',
				rerankScore: 0.5,
				metadata: {},
				updated_at: now,
				context_id: 'context_a'
			},
			{
				id: 'article_b',
				content: cognitive_science_datasets[0],
				source: 'vector',
				rerankScore: 0.5,
				metadata: {},
				updated_at: now,
				context_id: 'context_b'
			}
		]

		const recall_result: RecallResult = {
			nodes: [],
			edges: [],
			stimulated_nodes: [],
			related_contexts: [
				{
					relevance_score: 1,
					article_ids: ['article_a']
				},
				{
					relevance_score: 1,
					article_ids: ['article_b']
				}
			]
		}

		const { memory } = await aggregateResults({
			recall_result,
			search_results,
			sequence_context_id: 'context_a'
		})

		const memory_by_id = new Map(memory.map(item => [item.id, item]))
		const memory_a = memory_by_id.get('article_a')
		const memory_b = memory_by_id.get('article_b')

		expect(memory_a?.memoryStrength ?? 0).toBeGreaterThan(memory_b?.memoryStrength ?? 0)
	})
})
