import { beforeAll, describe, expect, it } from '@rstest/core'

import Fst from '../src/Fst'
import { getId } from '../src/utils'

describe('Scenario 04: Undo and Redo', () => {
	let fst: Fst
	const conversation_id = getId()

	beforeAll(async () => {
		fst = new Fst()
		fst.conversation_id = conversation_id
		await fst.init()
	})

	it('should undo a context update via tool command', async () => {
		await (
			await fst.think('Set the current task to "Step 1".')
		).text
		let shadow = (fst as any).session.getShadowContext()
		expect(shadow.current_task).toBe('Step 1')

		await (
			await fst.think('Actually, undo that last update.')
		).text
		shadow = (fst as any).session.getShadowContext()
		expect(shadow.current_task).not.toBe('Step 1')
	}, 60000)
})
