import { addTask, initGenModel, removeTask } from '@core/llama'
import { LlamaChatSession } from 'node-llama-cpp'

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

	const prompt = [`Expand this search query: ${query}`, intent && `Query intent: ${intent}`]
		.filter(Boolean)
		.join('\n')

	const session = new LlamaChatSession({
		contextSequence: sequence,
		systemPrompt:
			'You are a search query expansion expert. Extract keywords, rephrase as a question, and generate a hypothetical answer snippet.'
	})

	const grammar = await env.llama.createGrammarForJsonSchema({
		type: 'object',
		properties: {
			keywords: { type: 'string', description: '关键词' },
			question: { type: 'string', description: '语义短语' },
			answer: { type: 'string', description: '假设性结果片段' }
		},
		required: ['keywords', 'question', 'answer'],
		additionalProperties: false
	})

	const res = await session.prompt(prompt, { grammar })

	session.dispose()
	sequence.dispose()

	removeTask('gen', task_id)

	return JSON.parse(res) as SearchTarget
}
