import { normalizeSessionRuntimeConfig } from '@core/fst/session/config/shared'

import { safeJsonParse } from './utils'

import type { ImAccount } from '@core/db'

export const getImAccountRuntimeConfig = (account: Pick<ImAccount, 'config_json'>) => {
	const config = safeJsonParse(account.config_json, {})
	const runtime = config && typeof config === 'object' ? (config as { runtime?: unknown }).runtime : undefined

	return normalizeSessionRuntimeConfig(runtime as any)
}
