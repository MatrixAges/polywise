import { HTTPException } from 'hono/http-exception'

import type { ErrorHandler } from 'hono'
import type { core } from 'zod'

export default ((err, c) => {
	let error = err.message

	if (err instanceof HTTPException && err.cause) {
		const trpc_error = getTRPCErrorPayload(err.cause)
		const trpc_data = trpc_error ? getRecord(trpc_error.data) : null

		if (trpc_error && trpc_data) {
			const trpc_message = typeof trpc_error.message === 'string' ? trpc_error.message : ''

			if (trpc_data.code === 'BAD_REQUEST' && trpc_message) {
				try {
					const issues = JSON.parse(trpc_message) as Array<core.$ZodIssue>

					error = getIssuesText(issues)
				} catch {
					error = trpc_message
				}
			} else {
				error = String(trpc_message || error)
			}
		} else if (isRecord(err.cause) && Array.isArray(err.cause.issues)) {
			const cause = err.cause as { issues: Array<core.$ZodIssue> }

			error = getIssuesText(cause.issues)
		} else if (isRecord(err.cause) && typeof err.cause.message === 'string') {
			const cause = err.cause as { message: string }

			error = cause.message
		}
	}

	return c.json({ error }, (err as HTTPException).status)
}) as ErrorHandler

const getIssuesText = (v: Array<core.$ZodIssue>) => {
	return v.map((i: core.$ZodIssue) => `[${i.path.join('.')}] ${i.message}`).join(', ')
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const getRecord = (value: unknown) => {
	return isRecord(value) ? value : null
}

const getSerializedTRPCShape = (value: unknown): Record<string, unknown> | null => {
	const record = getRecord(value)

	if (!record) {
		return null
	}

	return getRecord(record.json) ?? record
}

const getTRPCErrorPayload = (value: unknown): Record<string, unknown> | null => {
	if (Array.isArray(value)) {
		for (const item of value) {
			const payload = getTRPCErrorPayload(item)

			if (payload) {
				return payload
			}
		}

		return null
	}

	const record = getRecord(value)

	if (!record) {
		return null
	}

	if ('error' in record) {
		return getSerializedTRPCShape(record.error)
	}

	return getSerializedTRPCShape(record)
}
