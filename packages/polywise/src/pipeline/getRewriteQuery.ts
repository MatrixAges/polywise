import { addTask, initGenModel, removeTask } from '@core/llama'
import { LlamaChatSession } from 'node-llama-cpp'

import { prompt } from '../consts'
import { env } from '../env'

interface SearchTarget {
	keywords: string
	question: string
	answer: string
}

export default async (query: string, intent?: string) => {
	await initGenModel()

	const task_id = addTask('gen')

	const sequence = env.gen_context.getSequence()

	const user_prompt = [`Query: ${query}`, intent && `Intent: ${intent}`].filter(Boolean).join('\n')

	const session = new LlamaChatSession({
		contextSequence: sequence,
		systemPrompt: prompt.get_search_target
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

	const res = await session.prompt(user_prompt, { grammar })

	session.dispose()
	sequence.dispose()

	removeTask('gen', task_id)

	return JSON.parse(res) as SearchTarget
}
