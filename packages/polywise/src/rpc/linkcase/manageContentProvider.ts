import { p } from '@core/utils'
import { z } from 'zod'

import { createPolywiseCrawl4aiProfile } from '../../utils/crawl4aiProfile'

const input_type = z.object({
	id: z.literal('crawl4ai'),
	action: z.enum(['create_profile', 'recreate_profile'])
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/manageContentProvider',
			description: 'Run Manage Content Provider'
		}
	})
	.input(input_type)
	.mutation(async ({ input }) => {
		if (input.id !== 'crawl4ai') {
			throw new Error(`Unsupported provider action target: ${input.id}`)
		}

		const result = await createPolywiseCrawl4aiProfile(input.action === 'recreate_profile')

		return {
			ok: true as const,
			...result
		}
	})
