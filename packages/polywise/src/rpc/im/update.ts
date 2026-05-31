import { im_account } from '@core/db/schema'
import { getImAccount, setImAccount } from '@core/db/services'
import { eq } from 'drizzle-orm'
import { object, string } from 'zod'

import { getImAccountSessionTargetConfig } from '../../im/runtimeConfig'
import { detachImAccountRouteBindings } from '../../im/session'
import { p } from '../../utils/trpc'
import { im_account_input_schema, im_account_schema, normalizeImAccount } from './shared'

const input_type = object({
	id: string()
}).merge(im_account_input_schema)

const normalizeConfigJson = (value: string) => JSON.stringify(JSON.parse(value))

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/im/update',
			description: 'Run Update'
		}
	})
	.input(input_type)
	.output(im_account_schema)
	.mutation(async ({ input }) => {
		const current = await getImAccount(eq(im_account.id, input.id))

		if (!current) {
			throw new Error('IM account not found')
		}

		const previous_target = getImAccountSessionTargetConfig(current)
		const next_target = getImAccountSessionTargetConfig({
			config_json: normalizeConfigJson(input.config_json)
		})
		const target_changed = JSON.stringify(previous_target) !== JSON.stringify(next_target)
		const route_scope_changed = current.platform !== input.platform || current.account_id !== input.account_id

		const updated = await setImAccount(eq(im_account.id, input.id), {
			platform: input.platform,
			account_id: input.account_id,
			label: input.label?.trim() || null,
			enabled: input.enabled,
			config_json: normalizeConfigJson(input.config_json)
		})

		if (route_scope_changed || target_changed) {
			await detachImAccountRouteBindings({
				platform: current.platform,
				account_id: current.account_id
			})
		}

		return normalizeImAccount(updated)
	})
