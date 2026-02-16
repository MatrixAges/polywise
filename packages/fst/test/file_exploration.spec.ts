import { beforeAll, describe, expect, it } from '@rstest/core'
import fs from 'fs-extra'

import Fst from '../src/Fst'
import { getId, getPath } from '../src/utils'

describe('Scenario 02: File Exploration', () => {
	let fst: Fst
	const conversation_id = getId()

	beforeAll(async () => {
		fst = new Fst()
		fst.conversation_id = conversation_id
		await fst.init()
	})

	it('should find content in message files using grep', async () => {
		await (
			await fst.think('Remember the secret code is 998877.')
		).text
		await (
			await fst.think('What was the code? Actually, forget it for now.')
		).text

		await new Promise(resolve => setTimeout(resolve, 2000))

		// Try forcing find tool first to list files, then grep
		const res = await fst.think(
			`First, list files in './conversations/${conversation_id}/messages/' using ls. Then use grep to find "998877" in those files.`
		)
		const text = await res.text
		expect(text).toContain('998877')
	}, 60000)
})
