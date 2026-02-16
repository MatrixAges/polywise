import { beforeAll, describe, expect, it } from '@rstest/core'

import Fst from '../src/Fst'
import { getId } from '../src/utils'

describe('Scenario 08: Tool Error Handling', () => {
	let fst: Fst
	const conversation_id = getId()

	beforeAll(async () => {
		fst = new Fst()
		fst.conversation_id = conversation_id
		await fst.init()
	})

	it('should handle a request for a non-existent file gracefully', async () => {
		const res = await fst.think('Read the file at /tmp/non_existent_file_xyz.txt and tell me what it says.')
		const text = await res.text
		expect(text.toLowerCase()).toContain('not found')
	}, 60000)
})
