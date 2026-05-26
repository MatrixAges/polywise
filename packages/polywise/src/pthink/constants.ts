import { config } from '@core/config'

import type { AppPthinkConfig } from '@core/types'
import type { PthinkConfig } from './types'

export const default_pthink_config: PthinkConfig = {
	enabled: true,
	idle_grace_ms: 20 * 60 * 1000,
	review_cooldown_ms: 15 * 60 * 1000,
	min_messages: 6,
	max_messages: 60,
	max_articles_per_run: 4,
	skill_generation_enabled: true,
	tool_generation_enabled: true,
	monitor_ms: 60_000
}

const toPositiveInt = (value: unknown, fallback: number) => {
	const num = Math.round(Number(value))

	return Number.isFinite(num) && num > 0 ? num : fallback
}

const toBoolean = (value: unknown, fallback: boolean) => {
	if (typeof value === 'boolean') return value

	return fallback
}

export const getPthinkConfig = (override?: Partial<AppPthinkConfig> | null): PthinkConfig => {
	const source = override ?? config.pthink ?? {}

	return {
		enabled: toBoolean(source.enabled, default_pthink_config.enabled),
		idle_grace_ms: toPositiveInt(source.idle_grace_ms, default_pthink_config.idle_grace_ms),
		review_cooldown_ms: toPositiveInt(source.review_cooldown_ms, default_pthink_config.review_cooldown_ms),
		min_messages: toPositiveInt(source.min_messages, default_pthink_config.min_messages),
		max_messages: toPositiveInt(source.max_messages, default_pthink_config.max_messages),
		max_articles_per_run: toPositiveInt(
			source.max_articles_per_run,
			default_pthink_config.max_articles_per_run
		),
		skill_generation_enabled: toBoolean(
			source.skill_generation_enabled,
			default_pthink_config.skill_generation_enabled
		),
		tool_generation_enabled: toBoolean(
			source.tool_generation_enabled,
			default_pthink_config.tool_generation_enabled
		),
		monitor_ms: default_pthink_config.monitor_ms
	}
}
