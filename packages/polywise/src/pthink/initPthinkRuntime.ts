import { env } from '@core/env'
import { getReportRuntime } from '@core/report'
import { log } from '@core/utils'
import { Cron } from 'croner'

import { getPthinkConfig, weekday_to_cron } from './constants'
import { defaultPthinkStatus, readPthinkStatus, writePthinkStatus } from './status'

import type { PthinkReportKind, PthinkRunSummary, PthinkRuntime, PthinkRuntimeStatus } from './types'

const scheduled_kinds = ['daily', 'weekly'] as const
const persist_interval_ms = 30_000

const toReportPeriod = (kind: (typeof scheduled_kinds)[number]) => (kind === 'daily' ? 'day' : 'week')

const createSummary = (args: {
	kind: (typeof scheduled_kinds)[number]
	key: string
	path: string
	created_at: number
}): PthinkRunSummary => ({
	kind: args.kind,
	title: `${args.kind === 'daily' ? 'Daily' : 'Weekly'} Report · ${args.key}`,
	summary: `Stored at ${args.path}`,
	post_id: null,
	session_id: null,
	trigger_key: null,
	created_at: args.created_at
})

const shouldRunScheduledJob = (status: PthinkRuntimeStatus) => {
	const current_config = getPthinkConfig()

	if (!current_config.enabled) {
		return { ok: false, reason: 'disabled' as const }
	}

	if (status.running) {
		return { ok: false, reason: 'already_running' as const }
	}

	if (env.active) {
		return { ok: false, reason: 'foreground_active' as const }
	}

	const last_active_at = Math.max(Number(status.last_foreground_at ?? 0), Number(status.last_visit_at ?? 0))

	if (Date.now() - last_active_at < current_config.idle_grace_ms) {
		return { ok: false, reason: 'idle_grace' as const }
	}

	const row = env.sqlite.prepare('SELECT id FROM session WHERE runing = 1 LIMIT 1').get() as
		| { id: string }
		| undefined

	if (row?.id) {
		return { ok: false, reason: 'session_running' as const }
	}

	return { ok: true as const }
}

export default async () => {
	const status = defaultPthinkStatus()
	let monitor_timer: NodeJS.Timeout | null = null
	let daily_job: Cron | null = null
	let weekly_job: Cron | null = null
	let cron_signature = ''
	let last_persist_at = 0
	const pending_kinds = new Set<(typeof scheduled_kinds)[number]>()

	const persistStatus = async (force = false) => {
		const now = Date.now()

		if (!force && now - last_persist_at < persist_interval_ms) {
			return
		}

		last_persist_at = now
		await writePthinkStatus(status).catch(() => null)
	}

	const setIdleState = async (reason: string) => {
		status.running = false
		status.last_status = 'idle'
		status.last_reason = reason
		status.last_run_at = Date.now()
		await persistStatus()
	}

	const clearCronJobs = () => {
		daily_job?.stop()
		weekly_job?.stop()
		daily_job = null
		weekly_job = null
		runtime.daily_job = null
		runtime.weekly_job = null
	}

	const scheduleCronJobs = () => {
		const current_config = getPthinkConfig()
		const next_signature = JSON.stringify({
			enabled: current_config.enabled,
			daily_report_enabled: current_config.daily_report_enabled,
			daily_report_hour: current_config.daily_report_hour,
			weekly_report_enabled: current_config.weekly_report_enabled,
			weekly_report_weekday: current_config.weekly_report_weekday,
			weekly_report_hour: current_config.weekly_report_hour
		})

		if (next_signature === cron_signature) {
			return
		}

		clearCronJobs()
		pending_kinds.clear()

		if (!current_config.enabled) {
			cron_signature = next_signature
			return
		}

		if (current_config.daily_report_enabled) {
			daily_job = new Cron(`0 ${current_config.daily_report_hour} * * *`, () => {
				pending_kinds.add('daily')
			})
			runtime.daily_job = daily_job
		}

		if (current_config.weekly_report_enabled) {
			weekly_job = new Cron(
				`0 ${current_config.weekly_report_hour} * * ${weekday_to_cron[current_config.weekly_report_weekday]}`,
				() => {
					pending_kinds.add('weekly')
				}
			)
			runtime.weekly_job = weekly_job
		}

		cron_signature = next_signature
	}

	const runScheduledReport = async (kind: (typeof scheduled_kinds)[number]) => {
		const report_runtime = getReportRuntime()
		const period = toReportPeriod(kind)
		const current_report = await report_runtime.query({ period, offset: 0 })

		if (current_report.exists && current_report.updated_at >= current_report.window.start_at) {
			status.running = false
			status.last_status = 'skipped'
			status.last_reason = `${kind}_already_generated`
			status.last_run_at = Date.now()
			await persistStatus(true)
			return null
		}

		status.running = true
		status.last_status = 'running'
		status.last_reason = `${kind}_scheduled`
		status.last_error = null
		status.last_run_at = Date.now()
		await persistStatus(true)

		try {
			await report_runtime.runNow({ period, offset: 0 })

			const next_report = await report_runtime.query({ period, offset: 0 })
			const created_at = Date.now()
			const summary = createSummary({
				kind,
				key: next_report.window.key,
				path: next_report.path,
				created_at
			})

			status.running = false
			status.last_status = 'success'
			status.last_reason = `${kind}_scheduled`
			status.last_error = null
			status.last_run_at = created_at
			status.last_report_at = created_at
			status.last_summary = summary
			status.report_history = [
				{
					post_id: '',
					session_id: null,
					notification_id: null,
					kind,
					title: summary.title,
					summary: summary.summary,
					trigger_key: null,
					created_at
				},
				...status.report_history
			].slice(0, 60)
			await persistStatus(true)

			return summary
		} catch (error) {
			status.running = false
			status.last_status = 'error'
			status.last_reason = `${kind}_scheduled`
			status.last_error = error instanceof Error ? error.message : String(error)
			status.last_run_at = Date.now()
			await persistStatus(true)
			throw error
		}
	}

	const runMonitor = async () => {
		scheduleCronJobs()

		if (pending_kinds.size === 0) {
			return
		}

		const allowed = shouldRunScheduledJob(status)

		if (!allowed.ok) {
			await setIdleState(allowed.reason)
			return
		}

		for (const kind of scheduled_kinds.slice().reverse()) {
			if (!pending_kinds.has(kind)) {
				continue
			}

			pending_kinds.delete(kind)
			await runScheduledReport(kind)
		}
	}

	const runtime: PthinkRuntime = {
		monitor_timer,
		daily_job,
		weekly_job,
		status,
		async start() {
			Object.assign(status, await readPthinkStatus(), {
				running: false,
				last_foreground_at: Date.now(),
				last_visit_at: Number(status.last_visit_at ?? Date.now())
			})

			scheduleCronJobs()
			monitor_timer = setInterval(() => {
				void runMonitor().catch(error => {
					log('SYSTEM', 'pthinkScheduleRuntimeError', () =>
						error instanceof Error ? error.message : String(error)
					)
				})
			}, getPthinkConfig().monitor_ms)
			runtime.monitor_timer = monitor_timer
			await persistStatus(true)
		},
		async stop() {
			if (monitor_timer) {
				clearInterval(monitor_timer)
				monitor_timer = null
				runtime.monitor_timer = null
			}

			clearCronJobs()
			await persistStatus(true)
		},
		async runNow(kind, args) {
			if ((kind === 'daily' || kind === 'weekly') && args?.force) {
				return runScheduledReport(kind)
			}

			return null
		},
		touchForeground() {
			status.last_foreground_at = Date.now()
		},
		touchVisit() {
			status.last_visit_at = Date.now()
		}
	}

	env.pthink = runtime
	await runtime.start()
}
