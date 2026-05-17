import { randomUUID } from 'crypto'
import path from 'path'
import { app, global_linkcase_session_id } from '@core/consts'
import { submit } from '@core/fst/utils'
import { connectSession } from '@core/utils'
import { writeFile } from 'atomically'
import { Cron } from 'croner'
import fs from 'fs-extra'

import { runLinkcaseBatch } from './utils'

export const linkcase_schedule_actions = ['fetch', 'extract'] as const
export const linkcase_schedule_interval_units = ['second', 'minute'] as const

export type LinkcaseScheduleAction = (typeof linkcase_schedule_actions)[number]
export type LinkcaseScheduleIntervalUnit = (typeof linkcase_schedule_interval_units)[number]
export type LinkcaseScheduleTaskStatus = 'idle' | 'running' | 'success' | 'error'
export type LinkcaseScheduleTask = {
	id: string
	action: LinkcaseScheduleAction
	interval_value: number
	interval_unit: LinkcaseScheduleIntervalUnit
	count: number
	auto_remove_dead_links: boolean
	enabled: boolean
	created_at: string
	updated_at: string
	next_run_at: string | null
	last_run_at: string | null
	last_error: string | null
	last_status: LinkcaseScheduleTaskStatus
	runs: number
}

type LinkcaseScheduleStore = {
	version: number
	tasks: Array<LinkcaseScheduleTask>
}

type LinkcaseScheduleRuntime = {
	store: LinkcaseScheduleStore
	jobs: Map<string, Cron>
}

const default_store: LinkcaseScheduleStore = {
	version: 1,
	tasks: []
}

const runtime: LinkcaseScheduleRuntime = {
	store: default_store,
	jobs: new Map()
}

let init_promise: Promise<void> | null = null

const now_iso = () => new Date().toISOString()

const normalizeTask = (value: Partial<LinkcaseScheduleTask> & { id?: unknown }) => {
	if (typeof value.id !== 'string' || !value.id) return null
	if (value.action !== 'fetch' && value.action !== 'extract') return null

	const now = now_iso()
	const interval_unit =
		value.interval_unit === 'second' || value.interval_unit === 'minute' ? value.interval_unit : 'minute'
	const last_status: LinkcaseScheduleTaskStatus =
		value.last_status === 'running' ||
		value.last_status === 'success' ||
		value.last_status === 'error' ||
		value.last_status === 'idle'
			? value.last_status
			: 'idle'

	return {
		id: value.id,
		action: value.action,
		interval_value: Math.max(Number(value.interval_value) || 1, 1),
		interval_unit,
		count: Math.min(Math.max(Number(value.count) || 1, 1), 10),
		auto_remove_dead_links: Boolean(value.auto_remove_dead_links),
		enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
		created_at: typeof value.created_at === 'string' ? value.created_at : now,
		updated_at: typeof value.updated_at === 'string' ? value.updated_at : now,
		next_run_at: typeof value.next_run_at === 'string' ? value.next_run_at : null,
		last_run_at: typeof value.last_run_at === 'string' ? value.last_run_at : null,
		last_error: typeof value.last_error === 'string' ? value.last_error : null,
		last_status,
		runs: Math.max(Number(value.runs) || 0, 0)
	} satisfies LinkcaseScheduleTask
}

const loadStore = async () => {
	await fs.ensureDir(path.dirname(app.linkcase_schedule_path))

	if (!(await fs.pathExists(app.linkcase_schedule_path))) {
		await writeFile(app.linkcase_schedule_path, JSON.stringify(default_store, null, 4), 'utf8')

		return default_store
	}

	const raw = await fs.readJson(app.linkcase_schedule_path)

	if (!raw || typeof raw !== 'object') {
		return default_store
	}

	const tasks = Array.isArray(raw.tasks)
		? (raw.tasks as Array<unknown>)
				.map(item => normalizeTask(item as Partial<LinkcaseScheduleTask> & { id?: unknown }))
				.filter((item): item is LinkcaseScheduleTask => Boolean(item))
		: []

	return {
		version: Number(raw.version) || 1,
		tasks
	} satisfies LinkcaseScheduleStore
}

const saveStore = async () => {
	await writeFile(app.linkcase_schedule_path, JSON.stringify(runtime.store, null, 4), 'utf8')
}

const getTask = (id: string) => runtime.store.tasks.find(task => task.id === id) ?? null

const getIntervalMs = (task: Pick<LinkcaseScheduleTask, 'interval_value' | 'interval_unit'>) =>
	Math.max(task.interval_value, 1) * (task.interval_unit === 'minute' ? 60_000 : 1_000)

const getNextRunAt = (task: Pick<LinkcaseScheduleTask, 'interval_value' | 'interval_unit'>, from_ms = Date.now()) =>
	new Date(from_ms + getIntervalMs(task)).toISOString()

const buildBatchPrompt = (task: Pick<LinkcaseScheduleTask, 'count' | 'auto_remove_dead_links'>) => {
	if (task.auto_remove_dead_links) {
		return [
			'Run one scheduled Linkcase batch fetch cycle.',
			`First list up to ${task.count} candidate links with status none, fail, or timeout.`,
			'Do not use linkcase_tool action "fetch_next" for this run.',
			'For each selected target, use the AI-guided preview workflow: fetch_preview, optionally read_preview, then commit_preview, mark_failed, or remove.',
			'Judge from the fetched preview content itself.',
			'Only remove a link when you are confident the target content is truly gone or there is no meaningful core content worth keeping.',
			'If the page is blocked by verification, anti-bot checks, login, subscription, or any other access barrier that prevents a confident judgment, do not remove it.',
			'When you cannot confidently confirm a dead link, keep it and mark_failed with a concise reason.',
			'If one provider preview already contains the correct and substantially complete target article body, commit it immediately and stop the provider chain.',
			'Before commit_preview, rewrite the fetched result into cleaned markdown that keeps only the core article body.',
			'If no candidates match, report that clearly.',
			'Return a concise summary with id, title, final action, status, source, article_id, and any removal or failure reason.'
		].join('\n')
	}

	return [
		'Run one scheduled Linkcase batch fetch cycle.',
		`Use linkcase_tool action "fetch_next" to fetch up to ${task.count} links.`,
		'Default priority should remain links with status none, fail, or timeout.',
		'If no candidates match, report that clearly.',
		'Return a concise summary with id, title, status, source, and any failures.'
	].join('\n')
}

const submitLinkcaseScheduledPrompt = async (task: Pick<LinkcaseScheduleTask, 'count' | 'auto_remove_dead_links'>) => {
	const session = await connectSession({ id: global_linkcase_session_id })
	await session.archiveMessages()
	await submit({ id: global_linkcase_session_id }, buildBatchPrompt(task))
}

const stopScheduledTask = (id: string) => {
	const job = runtime.jobs.get(id)

	if (!job) return

	job.stop()
	runtime.jobs.delete(id)
}

const scheduleTask = async (task_id: string, run_at?: string | null) => {
	const task = getTask(task_id)

	stopScheduledTask(task_id)

	if (!task || !task.enabled) {
		if (task) {
			task.next_run_at = null
			task.updated_at = now_iso()
			await saveStore()
		}

		return
	}

	const next_run_at = run_at ?? task.next_run_at ?? getNextRunAt(task)
	const next_run_ms = new Date(next_run_at).getTime()
	const safe_next_run_at =
		Number.isFinite(next_run_ms) && next_run_ms > Date.now() ? next_run_at : getNextRunAt(task)

	task.next_run_at = safe_next_run_at
	task.updated_at = now_iso()

	const job = new Cron(new Date(safe_next_run_at), async () => {
		runtime.jobs.delete(task_id)
		await triggerTask(task_id)
	})

	runtime.jobs.set(task_id, job)
	await saveStore()
}

const syncRuntime = async () => {
	for (const task of runtime.store.tasks) {
		if (!task.enabled) {
			task.next_run_at = null
			stopScheduledTask(task.id)
			continue
		}

		await scheduleTask(
			task.id,
			task.next_run_at && new Date(task.next_run_at).getTime() > Date.now()
				? task.next_run_at
				: getNextRunAt(task)
		)
	}
}

const isBusyError = (error: unknown) => {
	const message = error instanceof Error ? error.message : String(error)

	return message.startsWith('Linkcase task is already running')
}

const triggerTask = async (task_id: string) => {
	const task = getTask(task_id)

	if (!task || !task.enabled) return

	let next_run_at = getNextRunAt(task)

	task.last_status = 'running'
	task.last_error = null
	task.next_run_at = null
	task.updated_at = now_iso()
	await saveStore()

	try {
		if (task.action === 'fetch' && task.auto_remove_dead_links) {
			await submitLinkcaseScheduledPrompt(task)
		} else {
			await runLinkcaseBatch({
				count: task.count,
				run_fetch: task.action === 'fetch',
				run_extract: task.action === 'extract'
			})
		}

		task.runs += 1
		task.last_run_at = now_iso()
		task.last_status = 'success'
		task.last_error = null
	} catch (error) {
		if (isBusyError(error)) {
			next_run_at = new Date(Date.now() + 1_000).toISOString()
			task.last_status = 'idle'
		} else {
			task.last_status = 'error'
			task.last_error = error instanceof Error ? error.message : String(error)
		}
	} finally {
		task.updated_at = now_iso()

		if (task.enabled) {
			await scheduleTask(task.id, next_run_at)
		} else {
			await saveStore()
		}
	}
}

export const initLinkcaseScheduleRuntime = async () => {
	if (init_promise) {
		return init_promise
	}

	init_promise = (async () => {
		runtime.store = await loadStore()
		await syncRuntime()
	})()

	await init_promise
}

export const listLinkcaseSchedules = async () => {
	await initLinkcaseScheduleRuntime()

	return runtime.store.tasks
}

export const createLinkcaseSchedule = async (
	input: Pick<
		LinkcaseScheduleTask,
		'action' | 'interval_value' | 'interval_unit' | 'count' | 'auto_remove_dead_links'
	>
) => {
	await initLinkcaseScheduleRuntime()

	const now = now_iso()
	const task = {
		id: randomUUID(),
		action: input.action,
		interval_value: Math.max(input.interval_value, 1),
		interval_unit: input.interval_unit,
		count: Math.min(Math.max(input.count, 1), 10),
		auto_remove_dead_links: input.action === 'fetch' ? input.auto_remove_dead_links : false,
		enabled: true,
		created_at: now,
		updated_at: now,
		next_run_at: getNextRunAt(input),
		last_run_at: null,
		last_error: null,
		last_status: 'idle' as const,
		runs: 0
	} satisfies LinkcaseScheduleTask

	runtime.store.tasks.unshift(task)
	await scheduleTask(task.id, task.next_run_at)

	return task
}

export const updateLinkcaseSchedule = async (
	id: string,
	input: Partial<
		Pick<
			LinkcaseScheduleTask,
			'enabled' | 'count' | 'interval_value' | 'interval_unit' | 'auto_remove_dead_links'
		>
	>
) => {
	await initLinkcaseScheduleRuntime()

	const task = getTask(id)

	if (!task) {
		throw new Error(`Schedule "${id}" not found`)
	}

	if (typeof input.enabled === 'boolean') task.enabled = input.enabled
	if (typeof input.count === 'number') task.count = Math.min(Math.max(input.count, 1), 10)
	if (typeof input.interval_value === 'number') task.interval_value = Math.max(input.interval_value, 1)
	if (input.interval_unit === 'second' || input.interval_unit === 'minute') task.interval_unit = input.interval_unit
	if (typeof input.auto_remove_dead_links === 'boolean' && task.action === 'fetch') {
		task.auto_remove_dead_links = input.auto_remove_dead_links
	}

	task.updated_at = now_iso()

	if (!task.enabled) {
		task.next_run_at = null
		stopScheduledTask(task.id)
		await saveStore()

		return task
	}

	await scheduleTask(task.id, getNextRunAt(task))

	return task
}

export const removeLinkcaseSchedule = async (id: string) => {
	await initLinkcaseScheduleRuntime()

	stopScheduledTask(id)

	const index = runtime.store.tasks.findIndex(task => task.id === id)

	if (index === -1) {
		throw new Error(`Schedule "${id}" not found`)
	}

	runtime.store.tasks.splice(index, 1)
	await saveStore()

	return { removed: true as const, id }
}
