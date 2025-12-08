import type { Context } from 'hono'

export type HonoContext<T extends {} = {}> = Context<{}, string, T>

export type GetValidateData<T extends {}> = {
	in: {
		json: T
	}
	out: {
		json: T
	}
}
