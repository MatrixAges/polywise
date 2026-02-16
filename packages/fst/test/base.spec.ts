import { beforeAll, describe, expect, it } from '@rstest/core'

import Fst from '../src/Fst'

describe('Fst', () => {
	let fst: Fst = new Fst()

	beforeAll(async () => {
		await fst.init()
	})

	it('should be able to stream', async () => {
		const result = await fst.stream('Hello, who are you?')
		const text = await result.text

		expect(text).toBeTruthy()
	})

	it('should be able to generate', async () => {
		const result = await fst.generate('Hello, who are you?')

		expect(result.text).toBeTruthy()
	})
})
