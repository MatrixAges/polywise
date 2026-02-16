import { beforeAll, describe, expect, it } from '@rstest/core'
import fs from 'fs-extra'

import Fst from '../src/Fst'
import { getId, getPath } from '../src/utils'

describe('Scenario 05: Reference Handling', () => {
	let fst: Fst
	const conversation_id = getId()

	beforeAll(async () => {
		fst = new Fst()
		fst.conversation_id = conversation_id
		await fst.init()
	})

	it('should add and track a file reference', async () => {
		const dummy_path = getPath('/test_ref.txt')
		await fs.writeFile(dummy_path, 'This is a test reference file.')

		const res = await fst.think(`Add ${dummy_path} to my context references with description "Test File".`)
		await res.text

		const shadow = (fst as any).session.getShadowContext()
		expect(shadow.refs.some((r: any) => r.path === dummy_path)).toBe(true)
	}, 60000)
})
