import { env } from '@core/env'

import { createPthinkRuntime } from './runtime'

export default async () => {
	env.pthink = createPthinkRuntime()
	await env.pthink.start()
}
