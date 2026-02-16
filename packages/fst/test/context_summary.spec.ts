import { beforeAll, describe, expect, it } from '@rstest/core'

import Fst from '../src/Fst'
import { getId } from '../src/utils'

describe('Scenario 06: Context Summary Updates', () => {
	let fst: Fst
	const conversation_id = getId()

	beforeAll(async () => {
		fst = new Fst()
		fst.conversation_id = conversation_id
		await fst.init()
	})

	it('should automatically update the context summary as information is gained', async () => {
		await (
			await fst.think('My name is Alice and I like cats.')
		).text
		await (
			await fst.think('Summarize my preferences into the shadow context.')
		).text

		const shadow = (fst as any).session.getShadowContext()
		expect(shadow.context.toLowerCase()).toContain('alice')
		expect(shadow.context.toLowerCase()).toContain('cat')
	}, 60000)
})
