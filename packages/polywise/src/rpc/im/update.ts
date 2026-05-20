import { im_account } from '@core/db/schema'
import { setImAccount } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { p } from '../../utils/trpc'
import { im_account_input_schema, im_account_schema, normalizeImAccount } from './shared'

const input_type = object({
	id: string()
}).merge(im_account_input_schema)

const normalizeConfigJson = (value: string) => JSON.stringify(JSON.parse(value))

export default p
	.input(input_type)
	.output(im_account_schema)
	.mutation(async ({ input }) => {
		const updated = await setImAccount(eq(im_account.id, input.id), {
			platform: input.platform,
			account_id: input.account_id,
			label: input.label?.trim() || null,
			enabled: input.enabled,
			config_json: normalizeConfigJson(input.config_json)
		})

		if (!updated) {
			throw new Error('IM account not found')
		}

		return normalizeImAccount(updated)
	})
