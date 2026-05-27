import { config } from '@core/config'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek.js'

import type { AppReportConfig } from '@core/types'
import type { ReportPeriod } from './types'

dayjs.extend(isoWeek)

const default_report_time = '18:00'
const weekday_index_map = {
	mon: 0,
	tue: 1,
	wed: 2,
	thu: 3,
	fri: 4,
	sat: 5,
	sun: 6
} as const

interface ReportScheduleCandidate {
	period: ReportPeriod
	offset: number
	scheduled_at: number
}

const normalizeReportTime = (value: string | null | undefined) => {
	const text = typeof value === 'string' ? value.trim() : ''
	const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(text)
	const hours = match ? Number(match[1]) : 18
	const minutes = match ? Number(match[2]) : 0

	return {
		text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
		hours,
		minutes
	}
}

const withTime = (value: dayjs.Dayjs, time_value: string | null | undefined) => {
	const time = normalizeReportTime(time_value || default_report_time)

	return value.hour(time.hours).minute(time.minutes).second(0).millisecond(0)
}

const getDailyCandidate = (base: dayjs.Dayjs, report: AppReportConfig): ReportScheduleCandidate | null => {
	if (!report.daily_enabled) {
		return null
	}

	const current_due = withTime(base, report.daily_time)
	const offset = base.valueOf() >= current_due.valueOf() ? 0 : 1
	const scheduled_at = current_due.subtract(offset, 'day').valueOf()

	return {
		period: 'day',
		offset,
		scheduled_at
	}
}

const getWeeklyCandidate = (base: dayjs.Dayjs, report: AppReportConfig): ReportScheduleCandidate | null => {
	if (!report.weekly_enabled) {
		return null
	}

	const weekday = report.weekly_weekday || 'sun'
	const current_due = withTime(base.startOf('isoWeek').add(weekday_index_map[weekday], 'day'), report.weekly_time)
	const offset = base.valueOf() >= current_due.valueOf() ? 0 : 1
	const scheduled_at = current_due.subtract(offset, 'week').valueOf()

	return {
		period: 'week',
		offset,
		scheduled_at
	}
}

const getMonthlyCandidate = (base: dayjs.Dayjs, report: AppReportConfig): ReportScheduleCandidate | null => {
	if (!report.monthly_enabled) {
		return null
	}

	const mode = report.monthly_mode || 'last_day'

	if (mode === 'next_month_first_day') {
		const current_due = withTime(base.startOf('month'), report.monthly_time)
		const offset = base.valueOf() >= current_due.valueOf() ? 1 : 2
		const scheduled_at = current_due.subtract(offset - 1, 'month').valueOf()

		return {
			period: 'month',
			offset,
			scheduled_at
		}
	}

	const current_due = withTime(base.endOf('month').startOf('day'), report.monthly_time)
	const offset = base.valueOf() >= current_due.valueOf() ? 0 : 1
	const scheduled_at = withTime(
		base.subtract(offset, 'month').endOf('month').startOf('day'),
		report.monthly_time
	).valueOf()

	return {
		period: 'month',
		offset,
		scheduled_at
	}
}

const getYearlyCandidate = (base: dayjs.Dayjs, report: AppReportConfig): ReportScheduleCandidate | null => {
	if (!report.yearly_enabled) {
		return null
	}

	const mode = report.yearly_mode || 'last_day'

	if (mode === 'next_year_first_day') {
		const current_due = withTime(base.startOf('year'), report.yearly_time)
		const offset = base.valueOf() >= current_due.valueOf() ? 1 : 2
		const scheduled_at = current_due.subtract(offset - 1, 'year').valueOf()

		return {
			period: 'year',
			offset,
			scheduled_at
		}
	}

	const current_due = withTime(base.endOf('year').startOf('day'), report.yearly_time)
	const offset = base.valueOf() >= current_due.valueOf() ? 0 : 1
	const scheduled_at = withTime(
		base.subtract(offset, 'year').endOf('year').startOf('day'),
		report.yearly_time
	).valueOf()

	return {
		period: 'year',
		offset,
		scheduled_at
	}
}

export const getScheduledReportCandidates = (now = Date.now()) => {
	const report = config.report

	if (!report?.enabled) {
		return [] as Array<ReportScheduleCandidate>
	}

	const base = dayjs(now)

	return [
		getDailyCandidate(base, report),
		getWeeklyCandidate(base, report),
		getMonthlyCandidate(base, report),
		getYearlyCandidate(base, report)
	]
		.filter((item): item is ReportScheduleCandidate => Boolean(item))
		.sort((left, right) => left.scheduled_at - right.scheduled_at)
}
