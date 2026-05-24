import path from 'path'
import { logs_dir, pipeline_path } from '@core/consts/app'
import { emitPipelineRefresh } from '@core/rpc/pipeline/emitter'
import { writeFile } from 'atomically'
import fs from 'fs-extra'

export type SaveArticlePipelineTaskStatus = 'running' | 'done' | 'error'

export interface SaveArticlePipelineTask {
	created_at: string
	status: SaveArticlePipelineTaskStatus
	done_at: string | null
	error_message?: string | null
}

export interface SaveArticlePipelineLogEntry extends SaveArticlePipelineTask {
	article_id: string
}

export type SaveArticlePipelineStore = Record<string, SaveArticlePipelineTask>

const empty_store: SaveArticlePipelineStore = {}
const pipeline_logs_dir = path.resolve(logs_dir, 'pipeline')
const pipeline_log_file_regex = /^(\d{4}-\d{2}-\d{2})\.jsonl$/

const normalizeTask = (value: unknown): SaveArticlePipelineTask | null => {
	if (!value || typeof value !== 'object') return null

	const item = value as Partial<SaveArticlePipelineTask>

	if (typeof item.created_at !== 'string') return null
	if (item.status !== 'running' && item.status !== 'done' && item.status !== 'error') return null
	if (item.done_at !== null && typeof item.done_at !== 'string') return null
	if (item.error_message !== undefined && item.error_message !== null && typeof item.error_message !== 'string')
		return null

	return {
		created_at: item.created_at,
		status: item.status,
		done_at: item.done_at,
		error_message: item.error_message ?? null
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
	const store = await readPipelineStore()

	store[article_id] = task

	await writeFile(pipeline_path, JSON.stringify(store, null, 4), 'utf8')
	emitPipelineRefresh()

	return task
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
	const store = await readPipelineStore()
	const current_task = store[article_id]

	if (!current_task) return

	if (options?.archive !== false) {
		await appendPipelineLog({
			article_id,
			created_at: current_task.created_at,
			status: options?.status || 'done',
			done_at: options?.done_at ?? new Date().toISOString(),
			error_message: options?.error_message ?? current_task.error_message ?? null
		})
	}

	delete store[article_id]

	await writeFile(pipeline_path, JSON.stringify(store, null, 4), 'utf8')
	emitPipelineRefresh()
}
