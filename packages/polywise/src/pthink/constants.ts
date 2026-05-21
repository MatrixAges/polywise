import { config } from '@core/config'

import type { AppPthinkConfig } from '@core/types'
import type { PthinkConfig } from './types'

export const default_pthink_config: PthinkConfig = {
	enabled: true,
	idle_grace_ms: 20 * 60 * 1000,
	daily_report_enabled: true,
	daily_report_hour: 21,
	weekly_report_enabled: true,
	weekly_report_weekday: 'sun',
	weekly_report_hour: 20,
	trigger_enabled: true,
	max_reports_per_day: 3,
	monitor_ms: 60_000,
	trigger_cooldown_ms: 12 * 60 * 60 * 1000,
	idle_report_cooldown_ms: 18 * 60 * 60 * 1000
}

const toPositiveInt = (value: unknown, fallback: number) => {
	const num = Math.round(Number(value))

	return Number.isFinite(num) && num > 0 ? num : fallback
}

const toBoolean = (value: unknown, fallback: boolean) => {
	if (typeof value === 'boolean') return value

	return fallback
}

const toWeekday = (value: unknown, fallback: PthinkConfig['weekly_report_weekday']) => {
	return value === 'sun' ||
		value === 'mon' ||
		value === 'tue' ||
		value === 'wed' ||
		value === 'thu' ||
		value === 'fri' ||
		value === 'sat'
		? value
		: fallback
}

const toHour = (value: unknown, fallback: number) => {
	const num = Math.round(Number(value))

	return Number.isFinite(num) && num >= 0 && num <= 23 ? num : fallback
}

export const weekday_to_cron = {
	sun: 0,
	mon: 1,
	tue: 2,
	wed: 3,
	thu: 4,
	fri: 5,
	sat: 6
} as const

export const getPthinkConfig = (override?: Partial<AppPthinkConfig> | null): PthinkConfig => {
	const source = override ?? config.pthink ?? {}

	return {
		enabled: toBoolean(source.enabled, default_pthink_config.enabled),
		idle_grace_ms: toPositiveInt(source.idle_grace_ms, default_pthink_config.idle_grace_ms),
		daily_report_enabled: toBoolean(source.daily_report_enabled, default_pthink_config.daily_report_enabled),
		daily_report_hour: toHour(source.daily_report_hour, default_pthink_config.daily_report_hour),
		weekly_report_enabled: toBoolean(source.weekly_report_enabled, default_pthink_config.weekly_report_enabled),
		weekly_report_weekday: toWeekday(source.weekly_report_weekday, default_pthink_config.weekly_report_weekday),
		weekly_report_hour: toHour(source.weekly_report_hour, default_pthink_config.weekly_report_hour),
		trigger_enabled: toBoolean(source.trigger_enabled, default_pthink_config.trigger_enabled),
		max_reports_per_day: toPositiveInt(source.max_reports_per_day, default_pthink_config.max_reports_per_day),
		monitor_ms: default_pthink_config.monitor_ms,
		trigger_cooldown_ms: default_pthink_config.trigger_cooldown_ms,
		idle_report_cooldown_ms: default_pthink_config.idle_report_cooldown_ms
	}
}
