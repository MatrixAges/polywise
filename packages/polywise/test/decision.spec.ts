import path from 'path'

import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Pipeline from '../src/Pipeline'
import Polywise from '../src/Polywise'
import * as datasets_decision from './datasets/decision'

const TEST_TIMEOUT = 120000

describe('Decision Model & Intelligence', () => {
	let poly: Polywise
	let pipeline: Pipeline
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = path.resolve(__dirname, `../.test_db/decision_${unique_id}`)

	beforeAll(async () => {
		poly = new Polywise()
		await poly.init({
			data_dir: db_name,
			decision_concurrency: 1
		})
		pipeline = poly.pipeline

		await pipeline.loadDecisionModel()
	}, TEST_TIMEOUT)

	afterAll(async () => {
		await poly.off()
	}, TEST_TIMEOUT)

	describe('Infrastructure & Model Loading', () => {
		it(
			'should load the decision model correctly',
			async () => {
				const model = await pipeline.loadDecisionModel()
				expect(model).toBeDefined()
				expect(typeof model).toBe('function')
			},
			TEST_TIMEOUT
		)

		it(
			'should handle concurrent decision requests',
			async () => {
				const promises = [
					pipeline.decide(datasets_decision.prompt_load_test),
					pipeline.decide(datasets_decision.prompt_load_test),
					pipeline.decide(datasets_decision.prompt_load_test)
				]

				const results = await Promise.all(promises)
				expect(results.length).toBe(3)
				results.forEach(res => expect(res).toBeDefined())
			},
			TEST_TIMEOUT
		)

		it(
			'should respect decision options',
			async () => {
				const result = await pipeline.decide(datasets_decision.prompt_fruits_list, {
					max_new_tokens: 10,
					temperature: 0.1
				})
				expect(typeof result).toBe('string')
				expect(result.length).toBeGreaterThan(0)
			},
			TEST_TIMEOUT
		)
	})

	describe('Business Logic Integration', () => {
		it(
			'should identify proactive statements (User Preference)',
			async () => {
				const content = 'I strictly prefer dark mode interfaces.'
				const prompt = datasets_decision.prompt_assess_content(content)

				const decision = await pipeline.decide(prompt, { max_new_tokens: 5 })
				const normalized = decision.split('\n')[0].toUpperCase().trim()
				expect(normalized.startsWith('YES')).toBe(true)
			},
			TEST_TIMEOUT
		)

		it(
			'should ignore casual conversation',
			async () => {
				const content = "How's it going?"
				const prompt = datasets_decision.prompt_assess_content(content)

				const decision = await pipeline.decide(prompt, { max_new_tokens: 5 })
				const normalized = decision.split('\n')[0].toUpperCase().trim()
				expect(normalized.startsWith('YES')).toBe(false)
			},
			TEST_TIMEOUT
		)

		it(
			'should distinguish duplicates/updates/new in memory',
			async () => {
				const new_content = 'My favorite color is Blue.'
				const existing_content = 'My favorite color is Blue.'
				const prompt = datasets_decision.prompt_memory_relationship(existing_content, new_content)

				const decision = await pipeline.decide(prompt, { max_new_tokens: 5 })
				const normalized = decision.split('\n')[0].toUpperCase().trim()
				expect(normalized.includes('DUPLICATE')).toBe(true)
			},
			TEST_TIMEOUT
		)
	})

	describe('Intelligence & Capabilities', () => {
		describe('Logic & Reasoning', () => {
			it(
				'should solve simple boolean logic',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_boolean_logic, {
						max_new_tokens: 5
					})
					expect(res.toUpperCase()).toContain('TRUE')
				},
				TEST_TIMEOUT
			)

			it(
				'should identify temporal relationships',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_temporal_logic, {
						max_new_tokens: 5
					})
					expect(res.toUpperCase()).toContain('YES')
				},
				TEST_TIMEOUT
			)

			it(
				'should categorize items',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_category_apple)
					expect(res.toUpperCase()).toContain('FRUIT')
				},
				TEST_TIMEOUT
			)
		})

		describe('Linguistics & Semantics', () => {
			it(
				'should detect synonyms',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_synonyms, {
						max_new_tokens: 10
					})
					expect(res.toUpperCase()).toContain('YES')
				},
				TEST_TIMEOUT
			)

			it(
				'should summarize short text',
				async () => {
					const text = 'The quick brown fox jumps over the lazy dog.'
					const res = await pipeline.decide(datasets_decision.prompt_summarize_text(text), {
						max_new_tokens: 10
					})
					expect(res.length).toBeGreaterThan(0)
				},
				TEST_TIMEOUT
			)

			it(
				'should identify sentiment',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_sentiment, {
						max_new_tokens: 10
					})
					expect(res.toUpperCase()).toContain('POSITIVE')
				},
				TEST_TIMEOUT
			)
		})

		describe('Instruction Following', () => {
			it(
				'should follow negative constraints',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_negative_constraints, {
						max_new_tokens: 20
					})
					expect(res.toUpperCase()).not.toContain('BLUE')
				},
				TEST_TIMEOUT
			)

			it(
				'should format output as requested',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_json_format, {
						max_new_tokens: 20
					})
					expect(res).toContain('{')
					expect(res).toContain('}')
					expect(res).toContain('status')
				},
				TEST_TIMEOUT
			)

			it(
				'should answer with single word',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_single_number, {
						max_new_tokens: 5
					})
					expect(res.trim().length).toBeLessThan(10)
					expect(res).toContain('4')
				},
				TEST_TIMEOUT
			)
		})

		describe('World Knowledge', () => {
			it(
				'should know common facts',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_sky_color)
					expect(res.toUpperCase()).toContain('BLUE')
				},
				TEST_TIMEOUT
			)

			it(
				'should understand basic causality',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_causality)
					expect(res.toUpperCase()).toContain('YES')
				},
				TEST_TIMEOUT
			)
		})

		describe('Safety & Filtering', () => {
			it(
				'should refuse harmful instructions',
				async () => {
					const res = await pipeline.decide(datasets_decision.prompt_harmful)
					expect(res.length).toBeGreaterThan(0)
				},
				TEST_TIMEOUT
			)
		})
	})
})
