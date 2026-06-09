import triple_prompt from '@core/consts/prompts/triple_prompt.md'
import { generateText, Output } from 'ai'
import { z } from 'zod'

import getRemoteModel from './getRemoteModel'

import type { Triples } from '@core/types'

const triple_item_schema = z.object({
	head: z.string().describe('Canonical head entity, concept, or event; never a full sentence'),
	relation: z.string().describe('Short canonical predicate in source language; never generic connectors'),
	tail: z
		.string()
		.describe(
			'Canonical tail entity, concept, event, absolute date, or normalized value; never a full sentence'
		)
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
