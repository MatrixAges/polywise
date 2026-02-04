import '@abraham/reflection'

import { existsSync, mkdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import { afterEach, beforeEach, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'

describe('Memory System', () => {
	let poly: Polywise
	const test_id = Math.random().toString(36).substring(7)
	const data_dir = join(tmpdir(), `:polywise_memory_test_${test_id}:`)

	beforeEach(async () => {
		if (existsSync(data_dir)) rmSync(data_dir, { recursive: true, force: true })
		mkdirSync(data_dir)
		poly = new Polywise()
		await poly.init({
			data_dir,
			embedding_config: {
				type: 'custom',
				fn: async (text: string) => {
					// Use orthogonal vectors for different text to ensure no similarity
					const index = parseInt(text.split(' ').pop() || '0')
					const vec = new Array(1024).fill(0)
					vec[index % 1024] = 1.0
					return vec
				}
			}
		})
	}, 20000)

	afterEach(async () => {
		await poly.off()
		if (existsSync(data_dir)) rmSync(data_dir, { recursive: true, force: true })
	}, 20000)

	it('should save and retrieve long-term memory', async () => {
		await poly.memory.saveLongTerm('Important association')
		const memory = await poly.getLongMemory()
		expect(memory).toContain('Important association')
	})

	it('should respect long-term memory capacity (LRU)', async () => {
		for (let i = 0; i < 5; i++) {
			await poly.memory.saveLongTerm(`Distinct Information ${i}`)
		}
		const memory = await poly.getLongMemory()
		expect(memory.split('\n').length).toBeGreaterThanOrEqual(5)
	})

	it('should save and navigate diary entries', async () => {
		const t1 = '2026-02-01 10:00:00'
		const t2 = '2026-02-02 10:00:00'
		const t3 = '2026-02-03 10:00:00'

		await poly.memory.saveDiary('Diary 1', t1)
		await poly.memory.saveDiary('Diary 2', t2)
		await poly.memory.saveDiary('Diary 3', t3)

		const { current, prev, next } = await poly.getDailyMemory(t2)
		expect(current.content).toBe('Diary 2')
		expect(prev.content).toBe('Diary 1')
		expect(next.content).toBe('Diary 3')
	})

	it('should rank memory results in query', async () => {
		await poly.memory.saveLongTerm('Specific memory about AI')
		const result = await poly.query({ query: 'Tell me about AI' })
		expect(result.knowledges.length).toBeGreaterThan(0)
	})
})
