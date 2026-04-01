import { tool } from 'ai'
import { array, boolean, object, string } from 'zod'

const inputSchema = object({
	question: string().describe('The question to ask the user'),
	header: string().describe('Short label for the question'),
	options: array(
		object({
			label: string().describe('Display text for the option'),
			description: string().describe('Description of the option')
		})
	).describe('Available choices'),
	multiple: boolean().optional().describe('Allow selecting multiple options'),
	custom: boolean().optional().describe('Allow typing a custom answer')
})

export const createQuestionTool = () => {
	return tool({
		description: 'Ask the user a question with selectable options. Use when you need user input to proceed.',
		inputSchema
	})
}
