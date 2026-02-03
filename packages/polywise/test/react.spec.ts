import { afterAll, beforeAll, describe, expect, it } from '@rstest/core'

import Polywise from '../src/Polywise'
import { behavioral_knowledge, behavioral_stimuli } from './datasets/behavioral'

describe.concurrent('Polywise React System', () => {
	let poly: Polywise
	const unique_id = Math.random().toString(36).slice(2)
	const db_name = `:polywise_react_test_${unique_id}:`

	beforeAll(async () => {
		poly = new Polywise()
		await poly.init({
			data_dir: db_name
		})
	})

	afterAll(async () => {
		await poly.off()
	})

	it('should react instantly to a habitual stimulus using real models', async () => {
		for (const item of behavioral_stimuli) {
			const [stimulus_part, action_part, desc_part] = item.split('; ')
			const stimulus = stimulus_part.replace('刺激: ', '')
			const action = action_part.replace('动作: ', '')
			const desc = desc_part.replace('描述: ', '')

			const action_id = await poly.addNode({
				label: action,
				x: Math.random() * 800,
				y: Math.random() * 600,
				is_action: true,
				metadata: { desc }
			})

			const stimulus_id = await poly.addNode({
				label: stimulus,
				x: Math.random() * 800,
				y: Math.random() * 600,
				threshold: 0.1,
				embedding: (await poly.pipeline.embed(stimulus)) as number[]
			})

			await poly.connect({
				source_id: stimulus_id,
				target_id: action_id,
				weight: 0.9,
				is_habit: true
			})

			await poly.stimulate(stimulus_id, 0.5)
		}

		const fire_item_str = behavioral_stimuli.find(s => s.includes('火灾'))!
		const fire_stimulus = fire_item_str.split('; ')[0].replace('刺激: ', '')
		const fire_action = fire_item_str.split('; ')[1].replace('动作: ', '')

		const { result } = await poly.react(fire_stimulus)

		expect(result).toBeDefined()
		expect(result?.action).toBe(fire_action)
		expect(result?.source).toBe('react')
		expect(result?.confidence).toBeGreaterThanOrEqual(0.9)
	})

	it('should trigger slow thinking after fast reaction with real data', async () => {
		let action_received: any = null

		const poly_pfc = new Polywise()
		await poly_pfc.init({
			data_dir: `:pfc_test_${unique_id}:`
		})

		poly_pfc.onAction(res => {
			action_received = res
		})

		const fire_safety_content = behavioral_knowledge.find(k => k.includes('火灾'))!
		await poly_pfc.save({
			content: fire_safety_content
		})

		const fire_item_str = behavioral_stimuli.find(s => s.includes('火灾'))!
		const fire_stimulus = fire_item_str.split('; ')[0].replace('刺激: ', '')
		const fire_action = fire_item_str.split('; ')[1].replace('动作: ', '')

		const action_id = await poly_pfc.addNode({
			label: fire_action,
			x: 100,
			y: 100,
			is_action: true
		})

		const stimulus_id = await poly_pfc.addNode({
			label: fire_stimulus,
			x: 0,
			y: 0,
			threshold: 0.1,
			embedding: (await poly_pfc.pipeline.embed(fire_stimulus)) as number[]
		})

		await poly_pfc.connect({
			source_id: stimulus_id,
			target_id: action_id,
			weight: 0.5,
			is_habit: true
		})

		await poly_pfc.stimulate(stimulus_id, 0.5)

		const { result: fast_result, cot } = await poly_pfc.react(fire_stimulus)
		expect(fast_result?.action).toBe(fire_action)

		await cot.toPromise()

		expect(action_received).toBeDefined()
		expect(action_received.source).toBe('act')
		expect(action_received.action).toContain('火灾')

		await poly_pfc.off()
	}, 60000)

	it('should fall back to act path for complex physiological needs', async () => {
		let action_received: any = null

		const poly_act = new Polywise()
		await poly_act.init({
			data_dir: `:act_test_${unique_id}:`
		})

		poly_act.onAction(res => {
			action_received = res
		})

		const thirst_knowledge_content = behavioral_knowledge.find(k => k.includes('中暑'))!
		await poly_act.save({
			content: thirst_knowledge_content
		})

		const thirst_item_str = behavioral_stimuli.find(s => s.includes('口渴'))!
		const thirst_stimulus = thirst_item_str.split('; ')[0].replace('刺激: ', '')

		const { result: fast_result, cot } = await poly_act.react(thirst_stimulus)
		expect(fast_result).toBeNull()

		await cot.toPromise()

		expect(action_received).toBeDefined()
		expect(action_received.action).toContain('中暑')
		expect(action_received.source).toBe('act')

		await poly_act.off()
	}, 60000)
})
