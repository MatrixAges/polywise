import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { cognitive_science_datasets } from './datasets/cognitive'
import { process_test_cases } from './datasets/process'
import { getTestVectors } from './utils/getCache'
import getDataDir from './utils/getDataDir'

describe('Polywise Process', () => {
	let poly: Polywise
	const data_dir = getDataDir()

	beforeAll(async () => {
		poly = new Polywise()
		await poly.init({
			data_dir,
			embedding_config: {
				type: 'custom',
				fn: getTestVectors
			}
		})

		for (const text of cognitive_science_datasets.slice(0, 10)) {
			await poly.save({ content: text })
		}
	})

	afterAll(async () => {
		await poly.off()
	})

	it('should emit basic events during simple query execution', async () => {
		const query = 'Simple search test'
		const events: Array<string> = []
		let final_total: any = null

		const p = poly.process(query)

		p.on((event, total) => {
			events.push(event.key)
			final_total = total
		})

		await new Promise(resolve => {
			const check = setInterval(() => {
				if (final_total && final_total.final_result) {
					clearInterval(check)
					resolve(true)
				}
			}, 100)
		})

		expect(events).toContain('aggregated_results')
		expect(events).toContain('final_result')
	})

	for (const test_case of process_test_cases) {
		it(`should track execution process for query: "${test_case.query}" (CoT: ${test_case.cot_depth})`, async () => {
			const events: Array<string> = []
			let captured_total: any = null

			const p = poly.process(test_case.query)

			p.on((event, total) => {
				events.push(event.key)
				captured_total = total
			})

			if (test_case.cot_depth > 0) {
				await poly.query({ query: test_case.query, cot_depth: test_case.cot_depth, process: p })
			} else {
				await new Promise(resolve => {
					const check = setInterval(() => {
						if (captured_total && captured_total.final_result) {
							clearInterval(check)
							resolve(true)
						}
					}, 100)
				})
			}

			for (const expected of test_case.expected_events) {
				expect(events).toContain(expected)
			}

			const final_result = captured_total.final_result
			expect(final_result).toBeDefined()
			expect(final_result.memory.length).toBeGreaterThan(0)

			const all_texts = final_result.memory.join(' ').toLowerCase()
			for (const keyword of test_case.expected_memory_keywords) {
				expect(all_texts).toContain(keyword.toLowerCase())
			}

			expect(captured_total.reranked_memory).toBeDefined()
		})
	}

	it('should isolate concurrent processes', async () => {
		const events1: Array<string> = []
		const events2: Array<string> = []

		let done1 = false
		let done2 = false

		const p1 = poly.process('Query 1')
		p1.on(event => {
			events1.push(event.key)
			if (event.key === 'final_result') done1 = true
		})

		const p2 = poly.process('Query 2')
		p2.on(event => {
			events2.push(event.key)
			if (event.key === 'final_result') done2 = true
		})

		await new Promise(resolve => {
			const check = setInterval(() => {
				if (done1 && done2) {
					clearInterval(check)
					resolve(true)
				}
			}, 100)
		})

		expect(events1).toContain('final_result')
		expect(events2).toContain('final_result')

		expect(p1.hash).not.toBe(p2.hash)
		expect(p1.query).toBe('Query 1')
		expect(p2.query).toBe('Query 2')
	})
})
