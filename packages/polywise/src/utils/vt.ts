import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'

import type { ValidationTargets } from 'hono'
import type { ZodType } from 'zod'

export default <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) => {
	return zValidator(target, schema, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { cause: result.error })
		}
	})
}
