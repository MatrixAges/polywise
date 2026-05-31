import { env } from '@core/env'
import { array, boolean, number, object, string } from 'zod'

import { p } from '../../utils/trpc'

const output_type = object({
	adapters: array(
		object({
			platform: string(),
			account_id: string()
		})
	),
	routes: array(
		object({
			route_key: string(),
			running: boolean(),
			pending: number(),
			last_active_at: number()
		})
	)
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/im/health',
			description: 'Return IM runtime adapter and route health status.'
		}
	})
	.output(output_type)
	.query(async () => {
		if (!env.im) {
			return {
				adapters: [],
				routes: []
			}
		}

		return env.im.getHealth()
	})
