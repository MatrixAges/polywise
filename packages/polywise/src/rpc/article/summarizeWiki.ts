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
			summary: 'Summarize a conversation answer into wiki markdown'
		}
	})
	.input(
		object({
			question: string(),
			answer: string()
		})
	)
	.output(output_schema)
	.mutation(async ({ input }) => {
		const model = await getDefaultModel()
		const { output } = await generateText({
			model,
			system: [
				'You rewrite a user question and assistant answer into concise, durable wiki content.',
				'Keep only objective, reusable knowledge or clearly useful guidance.',
				'Remove conversational filler, hedging, repetition, and transient chat phrasing.',
				'Write in the same language as the source content unless a different language is clearly dominant in both inputs.',
				'Return compact markdown suitable for saving as a wiki article.',
				'The content must start with a level-1 heading using the generated title.',
				'Use short sections only when they materially improve clarity.',
				'Do not mention that this came from a chat or Q&A.'
			].join('\n'),
			prompt: [
				`User question:\n${input.question.trim()}`,
				`Assistant answer:\n${input.answer.trim()}`
			].join('\n\n'),
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
