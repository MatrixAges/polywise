import path from 'path'
import { app } from '@core/consts'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek.js'

import type { ReportPeriod, ReportStatus, ReportWindow } from './types'

dayjs.extend(isoWeek)

export const report_dir = path.resolve(app.app_path, 'report')
export const report_status_path = path.resolve(report_dir, 'status.json')
export const report_plan_path = path.resolve(report_dir, 'plan.md')

const report_period_title_map: Record<ReportPeriod, string> = {
	day: 'Daily',
	week: 'Weekly',
	month: 'Monthly',
	year: 'Yearly'
}

export const getDefaultReportStatus = (): ReportStatus => ({
	running: false,
	period: null,
	key: '',
	label: '',
	stage: 'idle',
	detail: '',
	progress: 0,
	error: '',
	report_path: '',
	plan_path: '',
	updated_at: Date.now(),
	last_completed_at: 0
})

export const getReportWindow = (period: ReportPeriod, offset = 0, now = Date.now()): ReportWindow => {
	const base = dayjs(now)

	switch (period) {
		case 'day': {
			const target = base.startOf('day').subtract(offset, 'day')
			const key = target.format('YYYY-MM-DD')

			return {
				period,
				offset,
				key,
				label: offset === 0 ? 'Today' : key,
				title: `Daily Report · ${key}`,
				start_at: target.valueOf(),
				end_at: target.add(1, 'day').valueOf(),
				file_name: `${key}.md`,
				file_path: path.resolve(report_dir, `${key}.md`)
			}
		}
		case 'week': {
			const target = base.startOf('isoWeek').subtract(offset, 'week')
			const key = `${target.isoWeekYear()}-W${String(target.isoWeek()).padStart(2, '0')}`

			return {
				period,
				offset,
				key,
				label: offset === 0 ? 'This week' : key,
				title: `Weekly Report · ${key}`,
				start_at: target.valueOf(),
				end_at: target.add(1, 'week').valueOf(),
				file_name: `${key}.md`,
				file_path: path.resolve(report_dir, `${key}.md`)
			}
		}
		case 'month': {
			const target = base.startOf('month').subtract(offset, 'month')
			const key = target.format('YYYY-MM')

			return {
				period,
				offset,
				key,
				label: offset === 0 ? 'This month' : key,
				title: `Monthly Report · ${key}`,
				start_at: target.valueOf(),
				end_at: target.add(1, 'month').valueOf(),
				file_name: `${key}.md`,
				file_path: path.resolve(report_dir, `${key}.md`)
			}
		}
		case 'year': {
			const target = base.startOf('year').subtract(offset, 'year')
			const key = target.format('YYYY')

			return {
				period,
				offset,
				key,
				label: offset === 0 ? 'This year' : key,
				title: `Yearly Report · ${key}`,
				start_at: target.valueOf(),
				end_at: target.add(1, 'year').valueOf(),
				file_name: `${key}.md`,
				file_path: path.resolve(report_dir, `${key}.md`)
			}
		}
	}
}

export const formatReportStageLabel = (period: ReportPeriod) => `${report_period_title_map[period]} reporting`

export const clampReportOffset = (value: number | undefined) => {
	if (!Number.isFinite(value)) {
		return 0
	}

	return Math.max(0, Math.floor(Number(value)))
}

export const formatReportTime = (value: number) => dayjs(value).format('YYYY-MM-DD HH:mm:ss')

export const formatCompactNumber = (value: number) =>
	new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

export const chunkList = <T>(list: Array<T>, size: number) => {
	if (size <= 0) {
		return [list]
	}

	const chunks = [] as Array<Array<T>>

	for (let index = 0; index < list.length; index += size) {
		chunks.push(list.slice(index, index + size))
	}

	return chunks
}
