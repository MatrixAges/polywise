import path from 'path'
import { logs_dir, pipeline_path } from '@core/consts/app'
import { emitPipelineRefresh } from '@core/rpc/pipeline/emitter'
import { writeFile } from 'atomically'
import fs from 'fs-extra'

export type SaveArticlePipelineTaskStatus = 'queued' | 'running' | 'done' | 'error'

export interface SaveArticlePipelineTask {
	created_at: string
	status: SaveArticlePipelineTaskStatus
	done_at: string | null
	error_message?: string | null
	status_text?: string | null
}

export interface SaveArticlePipelineLogEntry extends SaveArticlePipelineTask {
	article_id: string
}

export type SaveArticlePipelineStore = Record<string, SaveArticlePipelineTask>

const empty_store: SaveArticlePipelineStore = {}
const pipeline_logs_dir = path.resolve(logs_dir, 'pipeline')
const pipeline_log_file_regex = /^(\d{4}-\d{2}-\d{2})\.jsonl$/
const cancelled_pipeline_task_map = new Map<string, string>()
let pipeline_store_mutation_queue = Promise.resolve()
const pipeline_task_cancelled_message = 'Pipeline task cancelled'
const pipeline_task_interrupted_message = 'Pipeline task interrupted by server stop'

const normalizeTask = (value: unknown): SaveArticlePipelineTask | null => {
	if (!value || typeof value !== 'object') return null

	const item = value as Partial<SaveArticlePipelineTask>

	if (typeof item.created_at !== 'string') return null
	if (item.status !== 'queued' && item.status !== 'running' && item.status !== 'done' && item.status !== 'error')
		return null
	if (item.done_at !== null && typeof item.done_at !== 'string') return null
	if (item.error_message !== undefined && item.error_message !== null && typeof item.error_message !== 'string')
		return null
	if (item.status_text !== undefined && item.status_text !== null && typeof item.status_text !== 'string')
		return null

	return {
		created_at: item.created_at,
		status: item.status,
		done_at: item.done_at,
		error_message: item.error_message ?? null,
		status_text: item.status_text ?? null
	}
}

const normalizeLogEntry = (value: unknown): SaveArticlePipelineLogEntry | null => {
	if (!value || typeof value !== 'object') return null

	const item = value as Partial<SaveArticlePipelineLogEntry>
	const task = normalizeTask(item)

	if (!task || typeof item.article_id !== 'string' || !item.article_id.trim()) {
		return null
	}

	return {
		article_id: item.article_id,
		...task
	}
}

const getPipelineLogFilePath = (date: string) => path.resolve(pipeline_logs_dir, `${date}.jsonl`)

const appendPipelineLog = async (entry: SaveArticlePipelineLogEntry) => {
	const date = (entry.done_at || entry.created_at || new Date().toISOString()).slice(0, 10)

	await fs.ensureDir(pipeline_logs_dir)
	await fs.appendFile(getPipelineLogFilePath(date), JSON.stringify(entry) + '\n', 'utf8')
}

const runPipelineStoreMutation = async <T>(run: () => Promise<T>) => {
	const next_promise = pipeline_store_mutation_queue.then(run, run)

	pipeline_store_mutation_queue = next_promise.then(
		() => undefined,
		() => undefined
	)

	return next_promise
}

export const readPipelineStore = async () => {
	await fs.ensureDir(path.dirname(pipeline_path))

	if (!(await fs.pathExists(pipeline_path))) {
		await writeFile(pipeline_path, JSON.stringify(empty_store, null, 4), 'utf8')

		return { ...empty_store }
	}

	const raw = await fs.readJson(pipeline_path).catch(() => empty_store)

	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...empty_store }

	const store = Object.entries(raw).reduce<SaveArticlePipelineStore>((acc, [article_id, task]) => {
		const normalized = normalizeTask(task)

		if (normalized) acc[article_id] = normalized

		return acc
	}, {})

	return store
}

export const getPipelineTask = async (article_id: string) => {
	const store = await readPipelineStore()

	return store[article_id] ?? null
}

export const requestPipelineTaskCancel = async (article_id: string) => {
	return runPipelineStoreMutation(async () => {
		const store = await readPipelineStore()
		const current_task = store[article_id]

		if (!current_task) {
			return {
				cancelled: false,
				status: null
			}
		}

		cancelled_pipeline_task_map.set(article_id, current_task.created_at)

		if (current_task.status === 'queued') {
			delete store[article_id]
			await writeFile(pipeline_path, JSON.stringify(store, null, 4), 'utf8')
			emitPipelineRefresh({ article_id })

			return {
				cancelled: true,
				status: 'queued' as const
			}
		}

		store[article_id] = {
			...current_task,
			status_text: 'Cancelling'
		}

		await writeFile(pipeline_path, JSON.stringify(store, null, 4), 'utf8')
		emitPipelineRefresh({ article_id })

		return {
			cancelled: true,
			status: current_task.status
		}
	})
}

export const createPipelineTaskCancelledError = () => new Error(pipeline_task_cancelled_message)

export const isPipelineTaskCancelledError = (error: unknown) => {
	return error instanceof Error && error.message === pipeline_task_cancelled_message
}

export const assertPipelineTaskNotCancelled = (args: { article_id: string; created_at?: string | null }) => {
	const { article_id, created_at } = args

	if (created_at && cancelled_pipeline_task_map.get(article_id) === created_at) {
		throw createPipelineTaskCancelledError()
	}
}

export const readPipelineLogs = async (limit = 20) => {
	if (limit <= 0) {
		return [] as Array<SaveArticlePipelineLogEntry>
	}

	await fs.ensureDir(pipeline_logs_dir)

	const files = (await fs.readdir(pipeline_logs_dir))
		.map(file_name => file_name.match(pipeline_log_file_regex)?.[1] || '')
		.filter(Boolean)
		.sort((a, b) => b.localeCompare(a))

	const logs = [] as Array<SaveArticlePipelineLogEntry>

	for (const date of files) {
		const file_path = getPipelineLogFilePath(date)
		const content = await fs.readFile(file_path, 'utf8').catch(() => '')

		if (!content.trim()) {
			continue
		}

		const rows = content
			.split('\n')
			.map(line => line.trim())
			.filter(Boolean)
			.reduce((total, line) => {
				try {
					const entry = normalizeLogEntry(JSON.parse(line))

					if (entry) {
						total.push(entry)
					}
				} catch {}

				return total
			}, [] as Array<SaveArticlePipelineLogEntry>)
			.reverse()

		for (const row of rows) {
			logs.push(row)

			if (logs.length >= limit) {
				return logs
			}
		}
	}

	return logs
}

export const setPipelineTask = async (article_id: string, task: SaveArticlePipelineTask) => {
	return runPipelineStoreMutation(async () => {
		const store = await readPipelineStore()

		cancelled_pipeline_task_map.delete(article_id)
		store[article_id] = task

		await writeFile(pipeline_path, JSON.stringify(store, null, 4), 'utf8')
		emitPipelineRefresh({ article_id })

		return task
	})
}

export const patchPipelineTask = async (args: { article_id: string; task: Partial<SaveArticlePipelineTask> }) => {
	const { article_id, task } = args

	return runPipelineStoreMutation(async () => {
		const store = await readPipelineStore()
		const current_task = store[article_id]

		if (!current_task) {
			return null
		}

		store[article_id] = {
			...current_task,
			...task
		}

		await writeFile(pipeline_path, JSON.stringify(store, null, 4), 'utf8')
		emitPipelineRefresh({ article_id })

		return store[article_id]
	})
}

export const removePipelineTask = async (
	article_id: string,
	options?: {
		archive?: boolean
		done_at?: string | null
		status?: Extract<SaveArticlePipelineTaskStatus, 'done' | 'error'>
		error_message?: string | null
	}
) => {
	return runPipelineStoreMutation(async () => {
		const store = await readPipelineStore()
		const current_task = store[article_id]

		if (!current_task) return

		if (options?.archive !== false) {
			await appendPipelineLog({
				article_id,
				created_at: current_task.created_at,
				status: options?.status || 'done',
				done_at: options?.done_at ?? new Date().toISOString(),
				error_message: options?.error_message ?? current_task.error_message ?? null,
				status_text: current_task.status_text ?? null
			})
		}

		cancelled_pipeline_task_map.delete(article_id)
		delete store[article_id]

		await writeFile(pipeline_path, JSON.stringify(store, null, 4), 'utf8')
		emitPipelineRefresh({ article_id })
	})
}

export const clearRunningPipelineTasks = async () => {
	return runPipelineStoreMutation(async () => {
		const store = await readPipelineStore()
		const running_entries = Object.entries(store).filter(([, task]) => task.status === 'running')

		if (running_entries.length === 0) {
			return 0
		}

		const next_store = Object.entries(store).reduce<SaveArticlePipelineStore>((acc, [article_id, task]) => {
			if (task.status !== 'running') {
				acc[article_id] = task
			}

			return acc
		}, {})

		for (const [article_id, task] of running_entries) {
			await appendPipelineLog({
				article_id,
				created_at: task.created_at,
				status: 'error',
				done_at: new Date().toISOString(),
				error_message: pipeline_task_interrupted_message,
				status_text: task.status_text ?? null
			})
		}

		cancelled_pipeline_task_map.clear()
		await writeFile(pipeline_path, JSON.stringify(next_store, null, 4), 'utf8')
		emitPipelineRefresh()

		return running_entries.length
	})
}
