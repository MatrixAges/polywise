import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'

import type { ValidationTargets } from 'hono'
import type { ZodType } from 'zod'

export default <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) => {
	return zValidator(target, schema, result => {
		if (!result.success) {
			const issues = result.error.issues.map(i => ({
				path: i.path,
				message: i.message
			}))

			throw new HTTPException(400, { cause: { issues } })
		}
	})
}
