import { zValidator } from '@hono/zod-validator'

import type { ValidationTargets } from 'hono'
import type { ZodType } from 'zod'

export default <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) => {
	return zValidator(target, schema, (result, c) => {
		if (!result.success) {
			return c.json({ success: false, error: result.error }, 400)
		}
	})
}
