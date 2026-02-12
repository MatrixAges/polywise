import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import { getTestRerank, getTestVectors } from '../scripts/getTestVectors'
import Polywise from '../src/Polywise'
import { behavioral_knowledge, behavioral_qa } from './datasets/behavioral'
import getDataDir from './utils/getDataDir'

describe.concurrent('Polywise Unified Retrieval System', () => {
	let poly: Polywise
	const db_name = getDataDir()

	beforeAll(async () => {
		poly = new Polywise()

		await poly.init({
			data_dir: db_name,
			embedding_config: {
				type: 'custom',
				fn: getTestVectors
			},
			reranker_config: {
				type: 'custom',
				fn: getTestRerank
			}
		})

		// Use sequential save for stability and predictable performance in PGlite
		for (const content of behavioral_knowledge) {
			await poly.save({ content })
		}

		// Setup habit connections for the first 10 samples
		for (let i = 0; i < 10; i++) {
			const qa = behavioral_qa[i]
			const embedding = (await poly.pipeline.embed(qa.question)) as Array<number>

			const stimulus_id = await poly.addNode({
				label: `Stimulus: ${qa.question.slice(0, 50)}`,
				x: Math.random() * 800,
				y: Math.random() * 600,
				threshold: 0.1,
				embedding,
				metadata: { desc: qa.question }
			})

			const action_id = await poly.addNode({
				label: qa.expected_action,
				x: Math.random() * 800,
				y: Math.random() * 600,
				is_action: true
			})

			await poly.connect({
				source_id: stimulus_id,
				target_id: action_id,
				weight: 0.9,
				is_habit: true
			})

			await poly.stimulate(stimulus_id, 1.0)
		}
	}, 300000)

	afterAll(async () => {
		await poly.off()
	})

	it('should handle habitual actions (Fast Path) via unified query', async () => {
		for (let i = 0; i < 10; i++) {
			const qa = behavioral_qa[i]
			const { actions } = await poly.query({
				query: qa.question
			})

			expect(actions.length).toBeGreaterThan(0)
			expect(actions[0]).toContain(qa.expected_action)
		}
	}, 120000)

	it('should trigger cognitive search for non-habitual stimuli via unified query', async () => {
		// Use the same instance to test "Cognitive Path" (Slow Path) for non-habitual stimuli
		// Samples 10-14 in behavioral_qa were NOT connected as habits in beforeAll
		for (let i = 10; i < 13; i++) {
			const qa = behavioral_qa[i]

			const { knowledges, actions } = await poly.query({
				query: qa.question,
				cot_depth: 1
			})

			// It should find relevant knowledge via RAG since no habit exists
			expect(knowledges.length + actions.length).toBeGreaterThanOrEqual(1)
		}
	}, 120000)

	it('should handle emergency responses correctly via unified query', async () => {
		const fire_qa = behavioral_qa.find(q => q.question.includes('火灾'))!
		const { actions } = await poly.query({
			query: fire_qa.question
		})

		expect(actions.length).toBeGreaterThan(0)
		expect(actions[0]).toContain('疏散')
	}, 120000)
})
