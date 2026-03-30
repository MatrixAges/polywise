import { tool } from 'ai'
import { object, string } from 'zod'

export default tool({
	description: 'Get the current weather in a location',
	inputSchema: object({
		location: string().describe('The city and state, e.g. San Francisco, CA')
	}),
	execute: async ({ location }) => {
		return {
			location,
			temperature: 72,
			unit: 'fahrenheit',
			forecast: ['sunny', 'windy']
		}
	}
})
