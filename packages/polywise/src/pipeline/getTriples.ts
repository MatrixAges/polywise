import { config } from '@core/config'
import triple_prompt from '@core/consts/prompts/triple_prompt.md'
import { addTask, initGenModel, removeTask } from '@core/llama'
import { LlamaChatSession } from 'node-llama-cpp'

import { env } from '../env'
import genTriples from './genTriples'
import { isRemoteProvider } from './getRemoteModel'

import type { Triples } from '@core/types'

export default async (text: string, onTextChunk?: ((text: string) => void) | undefined) => {
	const target = config.triple_model ?? config.default_model

	if (isRemoteProvider(target.provider)) {
		return genTriples(text)
	}

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
				head: {
					type: 'string',
					description: 'Canonical head entity, concept, or event; never a full sentence'
				},
				relation: {
					type: 'string',
					description: 'Short canonical predicate in source language; never generic connectors'
				},
				tail: {
					type: 'string',
					description:
						'Canonical tail entity, concept, event, absolute date, or normalized value; never a full sentence'
				}
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
