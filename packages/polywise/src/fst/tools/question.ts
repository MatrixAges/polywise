import { SessionEventStore } from '@core/utils'
import { tool } from 'ai'
import { array, boolean, infer as Infer, object, string } from 'zod'

const inputSchema = object({
	question: string().describe('The question to ask the user'),
	options: array(
		object({
			label: string().describe('Display text for the option'),
			description: string().describe('Description of the option')
		})
	).describe('Available choices'),
	multiple: boolean().optional().describe('Allow selecting multiple options')
})

export type QuestionInput = Infer<typeof inputSchema>

export const createQuestionTool = (id: string) => {
	return tool({
		description: 'Ask the user a question with selectable options. Use when you need user input to proceed.',
		inputSchema,
		execute: async (_, { abortSignal }) => {
			const { promise, resolve } = Promise.withResolvers<string>()

			const handler = (v: string) => resolve(v)
			const abort = () => resolve('Question aborted')

			SessionEventStore.once(`${id}/answer`, handler)

			abortSignal?.addEventListener('abort', abort)

			const answer = await promise

			return answer
		}
	})
}
