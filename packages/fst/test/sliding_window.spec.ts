import { beforeAll, describe, expect, it } from '@rstest/core'

import Fst from '../src/Fst'
import { getId } from '../src/utils'

describe('Scenario 03: Sliding Window Memory', () => {
	let fst: Fst
	const conversation_id = getId()

	beforeAll(async () => {
		fst = new Fst()
		fst.conversation_id = conversation_id
		await fst.init()
	})

	it('should maintain shadow context even when history is pushed out of window', async () => {
		await (
			await fst.think('Update my shadow context summary to include: Project Alpha is active.')
		).text

		// Flood with 10 messages
		for (let i = 0; i < 10; i++) {
			await (
				await fst.think(`Noise message ${i}`)
			).text
		}

		const res = await fst.think('Is Project Alpha still active based on our shadow context?')
		const text = await res.text
		expect(text.toLowerCase()).toContain('alpha')
	}, 120000)
})
