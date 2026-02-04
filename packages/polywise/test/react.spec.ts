import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { behavioral_knowledge, behavioral_qa } from './datasets/behavioral'

describe.concurrent('Polywise React System', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_react_test_${unique_id}:`

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

	it('should handle multiple behavioral reactions (System 1 - Fast Path)', async () => {
		for (let i = 0; i < 10; i++) {
			const qa = behavioral_qa[i]
			const { result } = await poly.react(qa.question)

			expect(result).not.toBeNull()
			expect(result?.action).toContain(qa.expected_action)
			expect(result?.source).toBe('react')
		}
	}, 120000)

	it('should trigger slow thinking (System 2 - Act Path) for non-habitual stimuli', async () => {
		let actions_received: any[] = []

		const poly_slow = new Polywise()

		await poly_slow.init({
			data_dir: `:polywise_slow_test_${unique_id}:`
		})

		poly_slow.onAction(res => {
			actions_received.push(res)
		})

		for (const knowledge of behavioral_knowledge) {
			await poly_slow.save({ content: knowledge })
		}

		for (let i = 10; i < 15; i++) {
			const qa = behavioral_qa[i]
			const { result: fast_result, cot } = await poly_slow.react(qa.question)

			expect(fast_result).toBeNull()

			await cot.toPromise()
		}

		expect(actions_received.length).toBeGreaterThanOrEqual(5)
		for (const action of actions_received) {
			expect(action.source).toBe('act')
			expect(action.action.length).toBeGreaterThan(0)
		}

		await poly_slow.off()
	}, 300000)

	it('should maintain state and trigger correct path based on urgency', async () => {
		const fire_qa = behavioral_qa.find(q => q.question.includes('火灾'))!
		const { result: fast_result } = await poly.react(fire_qa.question)

		expect(fast_result?.action).toContain('疏散')
		expect(fast_result?.source).toBe('react')

		const search_qa = behavioral_qa.find(q => q.question.includes('纸团'))!
		const { result: slow_result, cot } = await poly.react(search_qa.question)

		expect(slow_result).toBeNull()
		await cot.toPromise()
	}, 120000)
})
