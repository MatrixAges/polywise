import path from 'path'
import { pipeline_path } from '@core/consts/app'
import { emitPipelineRefresh } from '@core/rpc/pipeline/emitter'
import { writeFile } from 'atomically'
import fs from 'fs-extra'

export type SaveArticlePipelineTaskStatus = 'running' | 'done' | 'error'

export interface SaveArticlePipelineTask {
	created_at: string
	status: SaveArticlePipelineTaskStatus
	done_at: string | null
}

export type SaveArticlePipelineStore = Record<string, SaveArticlePipelineTask>

const empty_store: SaveArticlePipelineStore = {}

const normalizeTask = (value: unknown): SaveArticlePipelineTask | null => {
	if (!value || typeof value !== 'object') return null

	const item = value as Partial<SaveArticlePipelineTask>

	if (typeof item.created_at !== 'string') return null
	if (item.status !== 'running' && item.status !== 'done' && item.status !== 'error') return null
	if (item.done_at !== null && typeof item.done_at !== 'string') return null

	return {
		created_at: item.created_at,
		status: item.status,
		done_at: item.done_at
	}
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

export const setPipelineTask = async (article_id: string, task: SaveArticlePipelineTask) => {
	const store = await readPipelineStore()

	store[article_id] = task

	await writeFile(pipeline_path, JSON.stringify(store, null, 4), 'utf8')
	emitPipelineRefresh()

	return task
}

export const removePipelineTask = async (article_id: string) => {
	const store = await readPipelineStore()

	if (!(article_id in store)) return

	delete store[article_id]

	await writeFile(pipeline_path, JSON.stringify(store, null, 4), 'utf8')
	emitPipelineRefresh()
}
