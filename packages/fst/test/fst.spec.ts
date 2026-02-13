import { beforeAll, describe, expect, it } from '@rstest/core'
import { container } from 'tsyringe'

import Fst from '../src/Fst'

describe('Fst', () => {
	let fst: Fst

	beforeAll(async () => {
		fst = container.resolve(Fst)
		await fst.init({
			conversation_id: 'test_conversation',
			session_id: 'test_session',
			router_model: {
				id: 'google/gemini-3-flash-preview',
				provider: 'google',
				model: 'gemini-3-flash-preview'
			},
			default_model: {
				id: 'google/gemini-3-pro-preview',
				provider: 'google',
				model: 'gemini-3-pro-preview'
			},
			cwd: process.cwd()
		})
	})

	it('should be able to think', async () => {
		await fst.think('Hello, who are you?')
	})
})
