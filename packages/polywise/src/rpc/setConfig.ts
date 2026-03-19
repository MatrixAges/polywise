import { to } from 'await-to-js'
import { boolean, object } from 'zod'

import { config_schema, saveConfig } from '../config'
import { p } from '../utils/trpc'

const output_type = object({ ok: boolean() })

export default p
	.meta({ openapi: { method: 'POST', path: '/setConfig' } })
	.input(config_schema)
	.output(output_type)
	.mutation(async ({ input }) => {
		const [err] = await to(saveConfig(input))

		if (err) {
			throw new Error(`Failed to update config: ${err.message}`)
		}

		return { ok: true }
	})
