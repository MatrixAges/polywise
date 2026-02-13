import { beforeAll, describe, expect, it } from '@rstest/core'

import Fst from '../src/Fst'

describe('Fst', () => {
	let fst: Fst = new Fst()

	beforeAll(async () => {
		await fst.init()
	})

	it('should be able to think', async () => {
		const result = await fst.think('Hello, who are you?')

		expect(result).toContain('Gemini')
	})
})
