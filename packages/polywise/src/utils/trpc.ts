import { initTRPC } from '@trpc/server'
import { ZodError } from 'zod'

import type { OpenApiMeta } from 'trpc-to-openapi'

const t = initTRPC.meta<OpenApiMeta>().create({
	errorFormatter({ shape, error }) {
		let message = error.message

		if (error.cause instanceof ZodError) {
			message = error.cause.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
		} else if (
			error.cause &&
			typeof error.cause === 'object' &&
			'issues' in error.cause &&
			Array.isArray(error.cause.issues)
		) {
			message = error.cause.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ')
		}

		return {
			code: shape.code,
			message
		}
	},
	isServer: true
})

export const p = t.procedure
export const r = t.router
