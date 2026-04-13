import { config } from '@core/config'
import rewrite_prompt from '@core/consts/prompts/rewrite_prompt.md'
import { addTask, initGenModel, removeTask } from '@core/llama'
import { LlamaChatSession } from 'node-llama-cpp'

import { env } from '../env'
import genRewriteQuery from './genRewriteQuery'
import { isRemoteProvider } from './getRemoteModel'

import type { SearchTarget } from './genRewriteQuery'

export default async (query: string, intent?: string): Promise<SearchTarget> => {
	const { provider } = config.rewrite_model

	if (isRemoteProvider(provider)) {
		return genRewriteQuery(query, intent)
	}

	await initGenModel()

	const task_id = addTask('gen')

	const sequence = env.gen_context.getSequence()

	const session = new LlamaChatSession({
		contextSequence: sequence,
		systemPrompt: rewrite_prompt
	})

	const grammar = await env.llama.createGrammarForJsonSchema({
		type: 'object',
		properties: {
			keywords: { type: 'string', description: 'Keywords' },
			question: { type: 'string', description: 'Semantic phrase' },
			answer: { type: 'string', description: 'Hypothetical result snippet' }
		},
		required: ['keywords', 'question', 'answer'],
		additionalProperties: false
	})

	const user_prompt = [`Query: ${query}`, intent && `Intent: ${intent}`].filter(Boolean).join('\n')

	const res = await session.prompt(user_prompt, { grammar })

	session.dispose()
	sequence.dispose()

	removeTask('gen', task_id)

	return JSON.parse(res) as SearchTarget
}
