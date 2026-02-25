import { describe, expect, it } from '@rstest/core'

import Pipeline from '../src/Pipeline'
import { sql_get_article_embedding } from '../src/sql'
import { sql_stimulate_nodes_batch } from '../src/sql/Brain'
import { rerankMemory } from '../src/utils/ranking'
import { getTestVectors } from './utils/getCache'

import type { Memory } from '../src/types'

describe.concurrent('Ranking stimulation gating', () => {
	it('should skip stimulation for low-confidence results', async () => {
		const pipeline = {
			embed: getTestVectors,
			rerank: async () => []
		} as unknown as Pipeline

		const candidates: Array<Memory> = [
			{
				id: 'node_a',
				content: 'alpha',
				source: 'external',
				score: 0.2,
				stimulated: false,
				memoryStrength: 0.05,
				metadata: {}
			},
			{
				id: 'node_b',
				content: 'beta',
				source: 'external',
				score: 0.25,
				stimulated: false,
				memoryStrength: 0.08,
				metadata: {}
			}
		]

		const query_calls: Array<string> = []
		const queryRaw = async (sql: string) => {
			query_calls.push(sql)

			if (sql === sql_get_article_embedding) {
				return []
			}

			return []
		}

		await rerankMemory('query', candidates, 2, pipeline, queryRaw, 0)

		const stimulate_calls = query_calls.filter(sql => sql === sql_stimulate_nodes_batch)
		const stimulate_count = stimulate_calls.length

		expect(stimulate_count).toBe(0)
	})

	it('should suppress stimulation when memory conflicts with ranking', async () => {
		const pipeline = {
			embed: getTestVectors,
			rerank: async () => []
		} as unknown as Pipeline

		const candidates: Array<Memory> = [
			{
				id: 'node_conflict',
				content: 'conflict',
				source: 'external',
				score: 0.1,
				stimulated: false,
				memoryStrength: 1.0,
				metadata: {}
			}
		]

		const query_calls: Array<string> = []
		const queryRaw = async (sql: string) => {
			query_calls.push(sql)

			if (sql === sql_get_article_embedding) {
				return []
			}

			return []
		}

		await rerankMemory('query', candidates, 1, pipeline, queryRaw, 0)

		const stimulate_calls = query_calls.filter(sql => sql === sql_stimulate_nodes_batch)
		const stimulate_count = stimulate_calls.length

		expect(stimulate_count).toBe(0)
	})

	it('should suppress stimulation for low source confidence', async () => {
		const pipeline = {
			embed: getTestVectors,
			rerank: async () => []
		} as unknown as Pipeline

		const candidates: Array<Memory> = [
			{
				id: 'node_source',
				content: 'source confidence',
				source: 'external',
				score: 0.9,
				stimulated: false,
				memoryStrength: 0.9,
				metadata: { source_confidence: 0.1 }
			}
		]

		const query_calls: Array<string> = []
		const queryRaw = async (sql: string) => {
			query_calls.push(sql)

			if (sql === sql_get_article_embedding) {
				return []
			}

			return []
		}

		await rerankMemory('query', candidates, 1, pipeline, queryRaw, 0)

		const stimulate_calls = query_calls.filter(sql => sql === sql_stimulate_nodes_batch)
		const stimulate_count = stimulate_calls.length

		expect(stimulate_count).toBe(0)
	})

	it('should suppress stimulation for repeated conflicts', async () => {
		const pipeline = {
			embed: getTestVectors,
			rerank: async () => []
		} as unknown as Pipeline

		const candidates: Array<Memory> = [
			{
				id: 'node_conflict_count',
				content: 'conflict count',
				source: 'external',
				score: 0.9,
				stimulated: false,
				memoryStrength: 0.9,
				metadata: { source_confidence: 1, conflict_count: 3, conflict_score: 0.1 }
			}
		]

		const query_calls: Array<string> = []
		const queryRaw = async (sql: string) => {
			query_calls.push(sql)

			if (sql === sql_get_article_embedding) {
				return []
			}

			return []
		}

		await rerankMemory('query', candidates, 1, pipeline, queryRaw, 0)

		const stimulate_calls = query_calls.filter(sql => sql === sql_stimulate_nodes_batch)
		const stimulate_count = stimulate_calls.length

		expect(stimulate_count).toBe(0)
	})
})
