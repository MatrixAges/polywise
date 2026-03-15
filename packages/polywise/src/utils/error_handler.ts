import { HTTPException } from 'hono/http-exception'

import type { ErrorHandler } from 'hono'
import type { core } from 'zod'

export default ((err, c) => {
	let error = err.message

	if (err instanceof HTTPException && err.cause) {
		const cause = err.cause as Record<string, unknown>

		if (cause.error && typeof cause.error === 'object' && 'data' in cause.error) {
			const trpc_error = cause.error as Record<string, unknown>
			const trpc_data = trpc_error.data as Record<string, unknown>

			if (trpc_data.code === 'BAD_REQUEST' && typeof trpc_error.message === 'string') {
				try {
					const issues = JSON.parse(trpc_error.message) as Array<core.$ZodIssue>

					error = getIssuesText(issues)
				} catch {
					error = trpc_error.message
				}
			} else {
				error = String(trpc_error.message || error)
			}
		} else if (Array.isArray(cause.issues)) {
			error = getIssuesText(cause.issues)
		} else if (typeof cause.message === 'string') {
			error = cause.message
		}
	}

	return c.json({ error }, (err as HTTPException).status)
}) as ErrorHandler

const getIssuesText = (v: Array<core.$ZodIssue>) => {
	return v.map((i: core.$ZodIssue) => `[${i.path.join('.')}] ${i.message}`).join(', ')
}
