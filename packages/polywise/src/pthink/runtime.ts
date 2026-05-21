import { addArticle, addNotification, addSession } from '@core/db/services'
import { addNotificationSession, addPostSession } from '@core/db/services/externals'
import { env } from '@core/env'
import { log } from '@core/utils'
import { Cron } from 'croner'
import dayjs from 'dayjs'

import { buildPthinkAnalytics, hasMeaningfulRecentActivity, pickPthinkTrigger } from './analytics'
import { getPthinkConfig, weekday_to_cron } from './constants'
import { defaultPthinkStatus, readPthinkStatus, writePthinkStatus } from './status'
import { synthesizePthinkReport } from './synthesize'

import type {
	PthinkAnalyticsSnapshot,
	PthinkReportKind,
	PthinkRunSummary,
	PthinkRuntime,
	PthinkRuntimeStatus,
	PthinkTriggerCandidate
} from './types'

const report_history_limit = 60
const idle_reason_persist_ms = 5 * 60 * 1000

const defaultSummary = (kind: PthinkReportKind): PthinkRunSummary => ({
	kind,
	title: '',
	summary: '',
	post_id: null,
	session_id: null,
	trigger_key: null,
	created_at: Date.now()
})

const getDayKey = (value: number) => dayjs(value).format('YYYY-MM-DD')
const getWeekKey = (value: number) => dayjs(value).startOf('week').format('YYYY-MM-DD')

const shouldRunInBackground = (status: PthinkRuntimeStatus) => {
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

const createReportArtifacts = async (args: {
	kind: PthinkReportKind
	title: string
	summary: string
	content: string
	analytics: PthinkAnalyticsSnapshot
	trigger?: PthinkTriggerCandidate | null
}) => {
	const now = new Date(args.analytics.generated_at)
	const post = await addArticle({
		title: args.title,
		content: args.content,
		for: 'memory',
		scope_type: 'global',
		scope_id: null,
		source: 'agent',
		is_pipelined: true,
		created_at: now,
		updated_at: now,
		metadata: {
			pthink: {
				kind: args.kind,
				trigger_key: args.trigger?.key ?? null,
				trigger_label: args.trigger?.label ?? null,
				summary: args.summary,
				created_at: args.analytics.generated_at,
				windows: {
					day: args.analytics.windows.day,
					week: args.analytics.windows.week
				},
				top_models: args.analytics.top_models
			}
		}
	})
	const session = await addSession({
		title: `PThink · ${args.title}`
	})

	await addPostSession(post.id, session.id)

	const notification = await addNotification({
		title: args.title,
		description: args.summary
	})

	await addNotificationSession(notification.id, session.id)

	return {
		post_id: post.id,
		session_id: session.id,
		notification_id: notification.id
	}
}

export const createPthinkRuntime = (): PthinkRuntime => {
	const status = defaultPthinkStatus()
	let monitor_timer: NodeJS.Timeout | null = null
	let daily_job: Cron | null = null
	let weekly_job: Cron | null = null
	const pending_kinds = new Set<PthinkReportKind>()
	let last_idle_persist_at = 0
	let cron_signature = ''

	const persistStatus = async () => {
		status.report_history = status.report_history
			.sort((a, b) => b.created_at - a.created_at)
			.slice(0, report_history_limit)
		await writePthinkStatus(status).catch(() => null)
	}

	const updateIdleReason = async (reason: string) => {
		const now = Date.now()
		status.last_status = 'idle'
		status.last_reason = reason

		if (now - last_idle_persist_at >= idle_reason_persist_ms) {
			last_idle_persist_at = now
			await persistStatus()
		}
	}

	const countReportsToday = (now: number) => {
		const today = getDayKey(now)

		return status.report_history.filter(item => getDayKey(item.created_at) === today).length
	}

	const hasKindToday = (kind: PthinkReportKind, now: number) => {
		const today = getDayKey(now)

		return status.report_history.some(item => item.kind === kind && getDayKey(item.created_at) === today)
	}

	const hasKindThisWeek = (kind: PthinkReportKind, now: number) => {
		const week = getWeekKey(now)

		return status.report_history.some(item => item.kind === kind && getWeekKey(item.created_at) === week)
	}

	const canCreateReport = (args: {
		kind: PthinkReportKind
		now: number
		trigger?: PthinkTriggerCandidate | null
		force?: boolean
		analytics: PthinkAnalyticsSnapshot
	}) => {
		const current_config = getPthinkConfig()

		if (!current_config.enabled && !args.force) {
			return { ok: false, reason: 'disabled' }
		}

		if (!args.force && countReportsToday(args.now) >= current_config.max_reports_per_day) {
			return { ok: false, reason: 'daily_limit' }
		}

		if (args.kind === 'daily') {
			if (!current_config.daily_report_enabled && !args.force) {
				return { ok: false, reason: 'daily_disabled' }
			}

			if (hasKindToday('daily', args.now)) {
				return { ok: false, reason: 'daily_exists' }
			}
		}

		if (args.kind === 'weekly') {
			if (!current_config.weekly_report_enabled && !args.force) {
				return { ok: false, reason: 'weekly_disabled' }
			}

			if (hasKindThisWeek('weekly', args.now)) {
				return { ok: false, reason: 'weekly_exists' }
			}
		}

		if (args.kind === 'idle') {
			if (!hasMeaningfulRecentActivity(args.analytics)) {
				return { ok: false, reason: 'idle_no_signal' }
			}

			const last_idle = status.report_history.find(item => item.kind === 'idle')

			if (last_idle && args.now - last_idle.created_at < current_config.idle_report_cooldown_ms) {
				return { ok: false, reason: 'idle_cooldown' }
			}

			if (
				status.last_report_at &&
				args.now - status.last_report_at < current_config.idle_report_cooldown_ms / 2
			) {
				return { ok: false, reason: 'recent_report' }
			}
		}

		if (args.kind === 'trigger') {
			if (!current_config.trigger_enabled && !args.force) {
				return { ok: false, reason: 'trigger_disabled' }
			}

			if (!args.trigger) {
				return { ok: false, reason: 'trigger_missing' }
			}

			const last_fired = Number(status.trigger_last_fired[args.trigger.key] ?? 0)

			if (last_fired && args.now - last_fired < current_config.trigger_cooldown_ms) {
				return { ok: false, reason: 'trigger_cooldown' }
			}
		}

		return { ok: true as const }
	}

	const runMonitor = async () => {
		const next_signature = JSON.stringify(getPthinkConfig())

		if (next_signature !== cron_signature) {
			scheduleCronJobs()
			cron_signature = next_signature
		}

		const allowed = shouldRunInBackground(status)

		if (!allowed.ok) {
			await updateIdleReason(allowed.reason)
			return
		}

		if (pending_kinds.has('weekly')) {
			pending_kinds.delete('weekly')
			await runtime.runNow('weekly')
			return
		}

		if (pending_kinds.has('daily')) {
			pending_kinds.delete('daily')
			await runtime.runNow('daily')
			return
		}

		const analytics = buildPthinkAnalytics()
		const trigger = getPthinkConfig().trigger_enabled
			? pickPthinkTrigger({
					analytics,
					status,
					trigger_cooldown_ms: getPthinkConfig().trigger_cooldown_ms
				})
			: null

		if (trigger) {
			await runtime.runNow('trigger', { analytics, trigger })
			return
		}

		if (!hasMeaningfulRecentActivity(analytics)) {
			await updateIdleReason('idle_waiting_signal')
			return
		}

		await runtime.runNow('idle', { analytics })
	}

	const scheduleCronJobs = () => {
		const current_config = getPthinkConfig()

		daily_job?.stop()
		weekly_job?.stop()
		daily_job = null
		weekly_job = null
		runtime.daily_job = null
		runtime.weekly_job = null

		if (!current_config.enabled) {
			pending_kinds.clear()
			cron_signature = JSON.stringify(current_config)
			return
		}

		if (!current_config.daily_report_enabled) {
			pending_kinds.delete('daily')
		}

		if (!current_config.weekly_report_enabled) {
			pending_kinds.delete('weekly')
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

		cron_signature = JSON.stringify(current_config)
	}

	const runtime: PthinkRuntime = {
		monitor_timer,
		daily_job,
		weekly_job,
		status,
		async start() {
			const saved_status = await readPthinkStatus()

			Object.assign(status, {
				...saved_status,
				running: false,
				last_status: saved_status.last_status ?? 'idle',
				last_error: saved_status.last_error ?? null,
				last_reason: saved_status.last_reason ?? null,
				last_summary: saved_status.last_summary ?? null,
				last_foreground_at: Date.now(),
				last_visit_at: Number(saved_status.last_visit_at ?? Date.now())
			})

			scheduleCronJobs()

			monitor_timer = setInterval(() => {
				void runMonitor().catch(error => {
					log('SYSTEM', 'pthinkMonitorError', () =>
						error instanceof Error ? error.message : String(error)
					)
				})
			}, getPthinkConfig().monitor_ms)
			runtime.monitor_timer = monitor_timer
			await persistStatus()
			await runMonitor().catch(() => null)
		},
		async stop() {
			if (monitor_timer) {
				clearInterval(monitor_timer)
				monitor_timer = null
				runtime.monitor_timer = null
			}

			daily_job?.stop()
			weekly_job?.stop()
			daily_job = null
			weekly_job = null
			runtime.daily_job = null
			runtime.weekly_job = null

			await persistStatus()
		},
		async runNow(kind, args = {}) {
			if (status.running) {
				return null
			}

			const now = Date.now()
			const analytics = args.analytics ?? buildPthinkAnalytics(now)
			const allowed = canCreateReport({
				kind,
				now,
				trigger: args.trigger,
				force: args.force,
				analytics
			})

			if (!allowed.ok) {
				status.last_status = 'skipped'
				status.last_reason = allowed.reason
				status.last_summary = defaultSummary(kind)
				status.last_summary.created_at = now
				await persistStatus()
				return null
			}

			status.running = true
			status.last_status = 'running'
			status.last_error = null
			status.last_reason = null
			await persistStatus()

			try {
				const report = await synthesizePthinkReport({
					kind,
					analytics,
					trigger: args.trigger
				})
				const artifacts = await createReportArtifacts({
					kind,
					title: report.title,
					summary: report.summary,
					content: report.content,
					analytics,
					trigger: args.trigger
				})
				const created_at = analytics.generated_at || now

				status.last_run_at = created_at
				status.last_report_at = created_at
				status.last_status = 'success'
				status.last_error = null
				status.last_reason = null
				status.last_summary = {
					kind,
					title: report.title,
					summary: report.summary,
					post_id: artifacts.post_id,
					session_id: artifacts.session_id,
					trigger_key: args.trigger?.key ?? null,
					created_at
				}
				status.report_history.unshift({
					post_id: artifacts.post_id,
					session_id: artifacts.session_id,
					notification_id: artifacts.notification_id,
					kind,
					title: report.title,
					summary: report.summary,
					trigger_key: args.trigger?.key ?? null,
					created_at
				})

				if (kind === 'trigger' && args.trigger?.key) {
					status.trigger_last_fired[args.trigger.key] = created_at
				}

				await persistStatus()

				return status.last_summary
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error)
				status.last_run_at = now
				status.last_status = 'error'
				status.last_error = message
				status.last_reason = kind
				status.last_summary = defaultSummary(kind)
				status.last_summary.created_at = now
				await persistStatus()
				throw error
			} finally {
				status.running = false
				await persistStatus()
			}
		},
		touchForeground() {
			status.last_foreground_at = Date.now()
			if (!status.running) {
				status.last_status = 'idle'
			}
		},
		touchVisit() {
			const now = Date.now()
			status.last_visit_at = now
			status.last_foreground_at = now
			if (!status.running) {
				status.last_status = 'idle'
			}
		}
	}

	return runtime
}
