import { env } from '@core/env'

import createRuntime from './createRuntime'
import loadStore from './loadStore'

export default async () => {
	const cron_store = await loadStore()

	env.cron = await createRuntime(cron_store)
}
