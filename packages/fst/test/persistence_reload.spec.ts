import { describe, expect, it } from '@rstest/core'

import Fst from '../src/Fst'
import { getId } from '../src/utils'

describe('Scenario 07: Persistence Reload', () => {
	const conversation_id = getId()

	it('should persist state across different Fst instances with same ID', async () => {
		const fst1 = new Fst()
		fst1.conversation_id = conversation_id
		await fst1.init()

		await (
			await fst1.think('Set current task to "Persistent Task".')
		).text

		const fst2 = new Fst()
		fst2.conversation_id = conversation_id
		await fst2.init()

		const shadow = (fst2 as any).session.getShadowContext()
		expect(shadow.current_task).toBe('Persistent Task')
	}, 60000)
})
