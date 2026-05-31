import { relationSearch } from '@core/io'

import { input_type, output_type } from '../../io/search/schema'
import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/search/relationSearch',
			description: 'Perform graph or relation-oriented search over linked knowledge.'
		}
	})
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const results = await relationSearch(input)

		return results
	})
