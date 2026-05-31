import { env } from '@core/env'
import { array, boolean, number, object, string } from 'zod'

import { p } from '../../utils/trpc'

const output_type = object({
	ok: boolean(),
	health: object({
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
})

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/im/reload',
			description: 'Run Reload'
		}
	})
	.output(output_type)
	.mutation(async () => {
		if (!env.im) {
			throw new Error('IM runtime not initialized')
		}

		await env.im.stop()
		env.im.adapters.clear()
		env.im.routes.clear()
		await env.im.start()

		return {
			ok: true,
			health: env.im.getHealth()
		}
	})
