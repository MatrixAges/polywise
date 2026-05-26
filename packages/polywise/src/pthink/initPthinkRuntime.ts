import { env } from '@core/env'

import { createPthinkRuntime } from './runtime'

export default async () => {
	const runtime = createPthinkRuntime()

	env.pthink = runtime
	await runtime.start()
}
