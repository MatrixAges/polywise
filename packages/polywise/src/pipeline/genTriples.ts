import triple_prompt from '@core/consts/prompts/triple_prompt.md'
import { generateText, Output } from 'ai'
import { z } from 'zod'

import getRemoteModel from './getRemoteModel'

import type { Triples } from '@core/types'

const triple_item_schema = z.object({
	head: z.string().describe('Head entity (subject)'),
	relation: z.string().describe('Relation (predicate)'),
	tail: z.string().describe('Tail entity (object)')
})

const triple_schema = z.object({
	items: z.array(triple_item_schema)
})

export default async (text: string) => {
	const { model: remote_model } = await getRemoteModel('triple')

	const { output: result } = await generateText({
		model: remote_model,
		system: triple_prompt,
		prompt: text,
		output: Output.object({ schema: triple_schema })
	})

	return result.items as Triples
}
