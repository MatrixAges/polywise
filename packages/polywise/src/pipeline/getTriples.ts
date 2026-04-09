import triple_prompt from '@core/consts/prompts/triple_prompt.md'
import { addTask, initGenModel, removeTask } from '@core/llama'
import { LlamaChatSession } from 'node-llama-cpp'

import { env } from '../env'

import type { Triples } from '@core/types'

export default async (text: string, onTextChunk?: ((text: string) => void) | undefined) => {
	await initGenModel()

	const task_id = addTask('gen')

	const sequence = env.gen_context.getSequence()

	const session = new LlamaChatSession({
		contextSequence: sequence,
		systemPrompt: triple_prompt
	})

	const grammar = await env.llama.createGrammarForJsonSchema({
		type: 'array',
		items: {
			type: 'object',
			properties: {
				head: { type: 'string', description: 'Head entity (subject)' },
				relation: { type: 'string', description: 'Relation (predicate)' },
				tail: { type: 'string', description: 'Tail entity (object)' }
			},
			required: ['head', 'relation', 'tail'],
			additionalProperties: false
		}
	})

	const res = await session.prompt(text, {
		grammar,
		onTextChunk
	})

	session.dispose()
	sequence.dispose()

	removeTask('gen', task_id)

	return JSON.parse(res) as Triples
}
