import { beforeAll, describe, expect, it } from '@rstest/core'
import fs from 'fs-extra'

import Fst from '../src/Fst'
import { getId, getPath } from '../src/utils'

describe('Scenario 10: Multi-step Complex Reasoning', () => {
	let fst: Fst
	const conversation_id = getId()

	beforeAll(async () => {
		fst = new Fst()
		fst.conversation_id = conversation_id
		await fst.init()
	})

	it('should perform multi-step analysis involving file creation and grep', async () => {
		// Turn 1: Create multiple files
		const setup_cmd =
			'Use bash to create 3 files in /tmp/fst_test: a.log, b.log, c.log. Put "Error 404" in b.log.'
		await (
			await fst.think(setup_cmd)
		).text

		// Turn 2: Analyze and update context
		const analysis_cmd =
			'Search for "Error" in /tmp/fst_test using grep. Then create a task "Fix 404" and update context summary with findings.'
		const res = await fst.think(analysis_cmd)
		const text = await res.text

		expect(text.toLowerCase()).toContain('b.log')
		const shadow = (fst as any).session.getShadowContext()
		expect(shadow.tasks.some((t: any) => t.name.includes('404'))).toBe(true)
	}, 120000)
})
