import { serve } from '@hono/node-server'

import apis from '../apis'

export default async () => {
	const { promise, resolve } = Promise.withResolvers()

	serve({ fetch: apis.fetch, port: 0 }, ({ port }) => resolve(port))

	return promise
}
