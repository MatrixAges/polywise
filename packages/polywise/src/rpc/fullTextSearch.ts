import { fullTextSearch } from '@core/io'

import { p } from '../utils/trpc'
import { input_type, output_type } from './SemanticSearch'

export default p
	.meta({ openapi: { method: 'GET', path: '/fullTextSearch' } })
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const results = await fullTextSearch(input)

		return results
	})
