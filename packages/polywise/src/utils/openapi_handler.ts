import { HTTPException } from 'hono/http-exception'
import { createOpenApiFetchHandler } from 'trpc-to-openapi'

import { router } from '../rpc'

import type { Handler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export default (async c => {
	const res = await createOpenApiFetchHandler({ endpoint: '/openapi', req: c.req.raw, router })

	if (res.status >= 400) {
		const data = await res.json()

		throw new HTTPException(res.status as ContentfulStatusCode, { cause: data })
	}

	return res
}) as Handler
