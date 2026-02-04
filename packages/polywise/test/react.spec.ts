import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { behavioral_knowledge, behavioral_qa } from './datasets/behavioral'

describe.concurrent('Polywise Unified Retrieval System', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_unified_test_${unique_id}:`

	beforeAll(async () => {
		poly = new Polywise()
		await poly.init({
			data_dir: db_name
		})

		for (const knowledge of behavioral_knowledge) {
			await poly.save({
				content: knowledge
			})
		}

		for (let i = 0; i < 10; i++) {
			const qa = behavioral_qa[i]

			await poly.habituate({
				stimulus: qa.question,
				action_label: qa.expected_action,
				weight: 0.9
			})

			const nodes = await poly.getAllNodes()

			const stimulus_node = nodes.find(n => n.label.includes(qa.question.slice(0, 20)))

			if (stimulus_node) {
				await poly.stimulate(stimulus_node.id, 1.0)
			}
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
			expect(actions[0].content).toContain(qa.expected_action)
			expect(actions[0].source).toBe('memory')
		}
	}, 120000)

	it('should trigger cognitive search for non-habitual stimuli via unified query', async () => {
		const poly_slow = new Polywise()

		await poly_slow.init({
			data_dir: `:polywise_slow_test_${unique_id}:`
		})

		for (const knowledge of behavioral_knowledge) {
			await poly_slow.save({ content: knowledge })
		}

		for (let i = 10; i < 15; i++) {
			const qa = behavioral_qa[i]

			const { knowledges, actions } = await poly_slow.query({
				query: qa.question,
				cot_depth: 1
			})

			expect(knowledges.length + actions.length).toBeGreaterThanOrEqual(1)
		}

		await poly_slow.off()
	}, 300000)

	it('should handle emergency responses correctly via unified query', async () => {
		const fire_qa = behavioral_qa.find(q => q.question.includes('火灾'))!
		const { actions } = await poly.query({
			query: fire_qa.question
		})

		expect(actions.length).toBeGreaterThan(0)
		expect(actions[0].content).toContain('疏散')
	}, 120000)
})
