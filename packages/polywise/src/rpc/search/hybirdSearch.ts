import { hybirdSearch } from '@core/io'

import { input_type, output_type } from '../../io/search/schema'
import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/search/hybirdSearch',
			description: 'Perform hybrid search that combines lexical and semantic retrieval.'
		}
	})
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const results = await hybirdSearch(input)

		return results
	})
