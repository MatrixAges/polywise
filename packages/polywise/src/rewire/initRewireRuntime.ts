import { env } from '@core/env'

import { createRewireRuntime } from './runtime'

export default async () => {
	env.rewire = createRewireRuntime()
	await env.rewire.start()
}
