import { HTTPException } from 'hono/http-exception'

import type { MiddlewareHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const visit_middleware: MiddlewareHandler = async (_c, next) => {
	try {
		const { env } = await import('@core/env')

		env.rewire?.touchVisit?.()
	} catch {
		// ignore runtime bootstrap races
	}

	await next()
}

export const error_middleware: MiddlewareHandler = async (c, next) => {
	await next()

	if (c.res.status >= 400) {
		const data = await c.res.json()

		throw new HTTPException(c.res.status as ContentfulStatusCode, { cause: data })
	}
}
