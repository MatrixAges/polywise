import { env } from '@core/env'

import { createImRuntime } from './runtime'

export default async () => {
	env.im = createImRuntime()

	// Do not block the server boot path on external IM handshakes.
	void env.im.start().catch(error => {
		console.error('[im] Runtime startup failed.', error)
	})
}
