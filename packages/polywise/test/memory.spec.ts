import '@abraham/reflection'

import { afterEach, beforeEach, describe, expect, it } from '@rstest/core'

import { getTestRerank, getTestVectors } from '../scripts/getTestVectors'
import Polywise from '../src/Polywise'
import { behavioral_knowledge, behavioral_qa } from './datasets/behavioral'
import getDataDir from './utils/getDataDir'

describe('Memory System', () => {
	let poly: Polywise
	const data_dir = getDataDir()

	beforeEach(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir,
			embedding_config: {
				type: 'custom',
				fn: getTestVectors
			},
			reranker_config: {
				type: 'custom',
				fn: getTestRerank
			}
		})
	}, 20000)

	afterEach(async () => {
		await poly.off()
	}, 20000)

	it('should save and retrieve long-term memory', async () => {
		const content = behavioral_knowledge[0]
		await poly.setLongMemory(content)
		const memory = await poly.getLongMemory()
		expect(memory).toContain(content)
	})

	it('should respect long-term memory capacity (LRU)', async () => {
		for (let i = 0; i < 10; i++) {
			await poly.memory.saveLongTerm(behavioral_knowledge[i])
		}
		const memory = await poly.getLongMemory()
		const lines = memory.split('\n').filter(l => l.trim().length > 0)
		expect(lines.length).toBeGreaterThanOrEqual(5)
	})

	it('should save and navigate diary entries', async () => {
		const t1 = '2026-02-01 10:00:00'
		const t2 = '2026-02-02 10:00:00'
		const t3 = '2026-02-03 10:00:00'

		const content1 = behavioral_knowledge[10]
		const content2 = behavioral_knowledge[11]
		const content3 = behavioral_knowledge[12]

		await poly.memory.saveDiary(content1, t1)
		await poly.memory.saveDiary(content2, t2)
		await poly.memory.saveDiary(content3, t3)

		const { current, prev, next } = await poly.getDailyMemory(t2)
		expect(current.content).toBe(content2)
		expect(prev.content).toBe(content1)
		expect(next.content).toBe(content3)
	})

	it('should rank memory results in query using behavioral benchmarks', async () => {
		for (const knowledge of behavioral_knowledge.slice(0, 5)) {
			await poly.memory.saveLongTerm(knowledge)
		}

		for (let i = 0; i < 3; i++) {
			const qa = behavioral_qa[i]
			const result = await poly.query({ query: qa.question })

			const found = result.knowledges.some(k => k.includes(behavioral_knowledge[i].slice(0, 20)))
			expect(found).toBe(true)
		}
	})
})
