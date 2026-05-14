import { relationSearch } from '@core/io'

import { input_type, output_type } from '../../io/search/schema'
import { p } from '../../utils/trpc'

export default p
	.meta({ openapi: { method: 'GET', path: '/search/relationSearch' } })
	.input(input_type)
	.output(output_type)
	.query(async ({ input }) => {
		const results = await relationSearch(input)

		return results
	})
