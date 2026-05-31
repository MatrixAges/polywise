import { semanticSearch } from '@core/io'

import { input_type, output_type } from '../../io/search/schema'
import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/search/semanticSearch',
			description: 'Perform embedding-based semantic search over indexed knowledge.'
		}
	})
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const results = await semanticSearch(input)

		return results
	})
