import getDefaultModel from '@core/fst/agents/tool/getDefaultModel'
import { generateText, Output } from 'ai'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'

const output_schema = object({
	title: string(),
	content: string()
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/article/summarizeWiki',
			description: 'Rewrite source content into concise wiki-style markdown with a generated title.'
		}
	})
	.input(
		object({
			question: string().optional(),
			answer: string()
		})
	)
	.output(output_schema)
	.mutation(async ({ input }) => {
		const question = input.question?.trim()
		const answer = input.answer.trim()
		const model = await getDefaultModel()
		const { output } = await generateText({
			model,
			system: [
				'You rewrite source material into concise, durable wiki content.',
				'The source may be either a user question plus assistant answer, or a standalone note to clean up.',
				'Keep only objective, reusable knowledge or clearly useful guidance.',
				'Remove conversational filler, hedging, repetition, and transient chat phrasing.',
				'Write in the same language as the source content unless a different language is clearly dominant in both inputs.',
				'Return compact markdown suitable for saving as a wiki article.',
				'The content must start with a level-1 heading using the generated title.',
				'Use short sections only when they materially improve clarity.',
				'Do not mention that this came from a chat or Q&A.'
			].join('\n'),
			prompt: question
				? [`User question:\n${question}`, `Assistant answer:\n${answer}`].join('\n\n')
				: `Source content:\n${answer}`,
			output: Output.object({ schema: output_schema })
		})
		const title = output.title.trim() || 'Wiki Note'
		const content = output.content.trim()
		const normalized_content = content.startsWith('#') ? content : `# ${title}\n\n${content}`

		return {
			title,
			content: normalized_content
		}
	})
