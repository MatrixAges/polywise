import { object, string } from 'zod'

import { bootstrapAuthPassword, changeConfiguredPassword, getAuthStatus } from '../../auth'
import { public_p, r } from '../../utils/trpc'

const password_input = object({
	password: string().trim().min(8)
})

const change_password_input = object({
	new_password: string().trim().min(8)
})

export default r({
	status: public_p.query(async ({ ctx }) => {
		return await getAuthStatus(ctx.req.headers, ctx.resHeaders)
	}),
	bootstrap: public_p.input(password_input).mutation(async ({ ctx, input }) => {
		const status = await getAuthStatus(ctx.req.headers, ctx.resHeaders)

		if (!status.enabled) {
			throw new Error('Auth is disabled in config.')
		}

		if (!status.bootstrap_required) {
			throw new Error('Auth account is already configured.')
		}

		await bootstrapAuthPassword(input.password)

		return await getAuthStatus(ctx.req.headers, ctx.resHeaders)
	}),
	changePassword: public_p.input(change_password_input).mutation(async ({ ctx, input }) => {
		const status = await getAuthStatus(ctx.req.headers, ctx.resHeaders)

		if (!status.enabled) {
			throw new Error('Auth is disabled in config.')
		}

		if (!status.has_account) {
			throw new Error('Auth account is not configured.')
		}

		if (!status.can_change_password) {
			throw new Error('Please login first.')
		}

		await changeConfiguredPassword(input.new_password)

		return { ok: true }
	})
})
