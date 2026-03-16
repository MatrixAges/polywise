import type { Context } from 'hono'

export interface HonoEnv {}

export type HonoContext<T extends {} = {}> = Context<HonoEnv, string, T>

export type GetValidateData<T extends {}> = {
	in: { json: T }
	out: { json: T }
}

export interface SqliteRow {
	rowid: number
}
