import { env } from '@core/env'

import { createImRuntime } from './runtime'

export default async () => {
	env.im = createImRuntime()
	await env.im.start()
}
