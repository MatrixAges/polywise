import { join } from 'path'
import fs from 'fs-extra'

import { getAppDataPath } from './path'

const TASK_DIR = getAppDataPath('/task')

export interface Task {
	id: string
	type: 'save' | 'update'
	args: any
	status: 'pending' | 'processing' | 'failed' | 'complete'
	error?: string
	created_at: number
}

// Ensure the directory exists
const ensureTaskDir = async () => {
	await fs.ensureDir(TASK_DIR)
}

export const syncTasks = async (pending: Array<Task>, processing: Array<Task>) => {
	await ensureTaskDir()
	await Promise.all([
		fs.writeJSON(join(TASK_DIR, 'pending.json'), pending, { spaces: 2 }),
		fs.writeJSON(join(TASK_DIR, 'processing.json'), processing, { spaces: 2 })
	])
	return true
}

export const getTasks = async () => {
	await ensureTaskDir()

	let pending: Array<Task> = []
	let processing: Array<Task> = []

	try {
		pending = await fs.readJSON(join(TASK_DIR, 'pending.json'))
	} catch (e) {
		// Ignore if file doesn't exist
	}

	try {
		processing = await fs.readJSON(join(TASK_DIR, 'processing.json'))
	} catch (e) {
		// Ignore if file doesn't exist
	}

	return { pending, processing }
}

export const archiveTask = async (task: Task) => {
	await ensureTaskDir()
	const archivePath = join(TASK_DIR, 'archive.json')

	let archive: Array<Task> = []
	try {
		archive = await fs.readJSON(archivePath)
	} catch (e) {
		// Ignore
	}

	archive.unshift(task) // Add to the beginning

	if (archive.length > 100) {
		const timestamp = Date.now()
		const shardPath = join(TASK_DIR, `archive_${timestamp}.json`)
		await fs.move(archivePath, shardPath)
		await fs.writeJSON(archivePath, [task], { spaces: 2 })
	} else {
		await fs.writeJSON(archivePath, archive, { spaces: 2 })
	}

	return true
}

export const getArchiveTasks = async (page: number) => {
	await ensureTaskDir()

	const pageSize = 100
	const files = await fs.readdir(TASK_DIR)
	const archiveFiles = files.filter(f => f.startsWith('archive') && f.endsWith('.json'))

	// Sort archive files: archive.json first, then archive_*.json sorted by timestamp descending
	archiveFiles.sort((a, b) => {
		if (a === 'archive.json') return -1
		if (b === 'archive.json') return 1
		// reverse alphabetical sorting will sort by timestamp descending
		return b.localeCompare(a)
	})

	const targetFileIndex = page - 1

	if (targetFileIndex < 0 || targetFileIndex >= archiveFiles.length) {
		return {
			data: [],
			total: archiveFiles.length * pageSize // Approximate total
		}
	}

	const targetPath = join(TASK_DIR, archiveFiles[targetFileIndex])
	let data: Array<Task> = []
	try {
		data = await fs.readJSON(targetPath)
	} catch (e) {
		data = []
	}

	return {
		data,
		total: archiveFiles.length * pageSize,
		page
	}
}
