import rewrite_prompt from '@core/consts/prompts/rewrite_prompt.md'
import { generateText, Output } from 'ai'
import { z } from 'zod'

import getRemoteModel from './getRemoteModel'

export interface SearchTarget {
	keywords: string
	question: string
	answer: string
}

const rewrite_schema = z.object({
	keywords: z.string().describe('Keywords'),
	question: z.string().describe('Semantic phrase'),
	answer: z.string().describe('Hypothetical result snippet')
})

export default async (query: string, intent?: string) => {
	const { model: remote_model } = await getRemoteModel('rewrite')

	const user_prompt = [`Query: ${query}`, intent && `Intent: ${intent}`].filter(Boolean).join('\n')

	const { output: result } = await generateText({
		model: remote_model,
		system: rewrite_prompt,
		prompt: user_prompt,
		output: Output.object({ schema: rewrite_schema })
	})

	return result as SearchTarget
}
