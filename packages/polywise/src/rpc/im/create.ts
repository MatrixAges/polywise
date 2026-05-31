import { p } from '@core/utils'

import { addImAccount } from '../../db/services'
import { im_account_input_schema, im_account_schema, normalizeImAccount } from './shared'

const normalizeConfigJson = (value: string) => JSON.stringify(JSON.parse(value))

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/im/create',
			description: 'Create a new IM account configuration.'
		}
	})
	.input(im_account_input_schema)
	.output(im_account_schema)
	.mutation(async ({ input }) => {
		const created = await addImAccount({
			platform: input.platform,
			account_id: input.account_id,
			label: input.label?.trim() || null,
			enabled: input.enabled,
			config_json: normalizeConfigJson(input.config_json),
			status: 'idle',
			last_error: null
		})

		return normalizeImAccount(created)
	})
