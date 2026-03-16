import { initGenModel } from '@core/llama'
import { LlamaChatSession } from 'node-llama-cpp'

import { prompt } from '../consts'
import { env } from '../env'

import type { Triples } from '@core/types'

export default async (text: string, onTextChunk?: ((text: string) => void) | undefined) => {
	await initGenModel()

	const session = new LlamaChatSession({
		contextSequence: env.gen_context.getSequence(),
		systemPrompt: prompt.get_triple
	})

	const grammar = await env.llama.createGrammarForJsonSchema({
		type: 'array',
		items: {
			type: 'object',
			properties: {
				head: { type: 'string', description: '头实体（主语）' },
				relation: { type: 'string', description: '关系（谓语）' },
				tail: { type: 'string', description: '尾实体（宾语）' }
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

	return JSON.parse(res) as Triples
}
