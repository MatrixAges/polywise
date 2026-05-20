import { boolean, object, string, enum as zod_enum } from 'zod'

export const im_platform_schema = zod_enum(['discord', 'wechat'])
export type ImPlatformValue = 'discord' | 'wechat'

export const im_account_schema = object({
	id: string(),
	platform: im_platform_schema,
	account_id: string(),
	label: string().nullable(),
	enabled: boolean(),
	config_json: string().nullable(),
	status: string(),
	last_error: string().nullable(),
	created_at: string().datetime().nullable(),
	updated_at: string().datetime().nullable()
})

export const im_account_input_schema = object({
	platform: im_platform_schema,
	account_id: string().trim().min(1),
	label: string().trim().optional(),
	enabled: boolean().default(true),
	config_json: string().trim().default('{}')
})

export const normalizeImAccount = (item: {
	id: string
	platform: string
	account_id: string
	label: string | null
	enabled: boolean
	config_json: string | null
	status: string
	last_error: string | null
	created_at: Date | null
	updated_at: Date | null
}) => ({
	id: item.id,
	platform: item.platform as ImPlatformValue,
	account_id: item.account_id,
	label: item.label,
	enabled: item.enabled,
	config_json: item.config_json,
	status: item.status,
	last_error: item.last_error,
	created_at: item.created_at?.toISOString() ?? null,
	updated_at: item.updated_at?.toISOString() ?? null
})
