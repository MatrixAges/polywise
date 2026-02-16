import { beforeAll, describe, expect, it } from '@rstest/core'

import Fst from '../src/Fst'
import { getId } from '../src/utils'

describe('Scenario 09: Bash Tool Integration', () => {
	let fst: Fst
	const conversation_id = getId()

	beforeAll(async () => {
		fst = new Fst()
		fst.conversation_id = conversation_id
		await fst.init()
	})

	it('should execute a bash command and report the output', async () => {
		const res = await fst.think('Use the bash tool to output "FST_BASH_TEST_SUCCESS".')
		const text = await res.text
		expect(text).toContain('FST_BASH_TEST_SUCCESS')
	}, 60000)
})
