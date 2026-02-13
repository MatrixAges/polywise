import { beforeAll, describe, expect, it } from '@rstest/core'
import { container } from 'tsyringe'

import Fst from '../src/Fst'
import Sessions from '../src/Sessions'
import { mingo_structured_prompts, react_optimization_chat, streaming_prompts, tool_usage_prompts } from './datasets'

describe('Fst', () => {
	let fst: Fst
	let sessions: Sessions

	beforeAll(async () => {
		fst = container.resolve(Fst)
		sessions = container.resolve(Sessions)

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

	describe('Core Thinking', () => {
		it('should be able to think', async () => {
			const result = await fst.think('Hello, who are you?')

			expect(result).toBeTruthy()
			expect(result.toLowerCase()).toContain('gemini')
		})
	})

	describe('Streaming', () => {
		it('should stream response', async () => {
			const stream = await fst.streamThink(streaming_prompts[0])

			expect(stream).toBeTruthy()

			let fullText = ''
			for await (const chunk of stream.textStream) {
				process.stdout.write(chunk)
				fullText += chunk
			}

			expect(fullText).toBeTruthy()
		})
	})

	describe('Mingo Structured Context', () => {
		it('should update and query context using mingo', async () => {
			await fst.think(mingo_structured_prompts[0])

			const results = sessions.queryContext({ name: 'Alice' })
			expect(results.length).toBeGreaterThan(0)
			expect(results[0].name).toBe('Alice')

			await fst.think(mingo_structured_prompts[1])
			const projectResults = sessions.queryContext({ project: /React/i })
			expect(projectResults.length).toBeGreaterThan(0)
		})
	})

	describe('Tool Usage', () => {
		it('should use tools when prompted', async () => {
			const result = await fst.think(tool_usage_prompts[2]) // List files in src

			expect(result).toBeTruthy()
			expect(result.toLowerCase()).toContain('fst.ts')
		})
	})

	describe('Complex React Optimization Scenario', () => {
		it('should handle 12+ turns of performance optimization dialogue', async () => {
			for (const prompt of react_optimization_chat) {
				const result = await fst.think(prompt)
				expect(result).toBeTruthy()
			}
		}, 300000) // 5 minutes timeout for 13 turns
	})
})
