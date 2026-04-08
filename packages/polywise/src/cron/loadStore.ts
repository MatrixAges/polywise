import path from 'path'
import { cron_path } from '@core/consts/app'
import { writeFile } from 'atomically'
import fs from 'fs-extra'

import type { CronStore, CronTask } from './types'

const default_store: CronStore = {
	version: 1,
	tasks: []
}

export default async () => {
	await fs.ensureDir(path.dirname(cron_path))

	const exists = await fs.pathExists(cron_path)

	if (!exists) {
		await writeFile(cron_path, JSON.stringify(default_store, null, 4), 'utf8')

		return default_store
	}

	const raw = await fs.readJson(cron_path)

	if (!raw || typeof raw !== 'object') return default_store

	const version = Number(raw.version) || 1
	const raw_tasks = Array.isArray(raw.tasks) ? (raw.tasks as Array<CronTask>) : []

	const tasks = raw_tasks
		.filter(
			(item): item is CronTask & { name: string; cron: string } =>
				Boolean(item) &&
				typeof item === 'object' &&
				typeof item.name === 'string' &&
				typeof item.cron === 'string'
		)
		.map((item): CronTask => {
			const now = new Date().toISOString()
			const last_status: CronTask['last_status'] =
				item.last_status === 'success' || item.last_status === 'error' || item.last_status === 'idle'
					? item.last_status
					: 'idle'

			return {
				name: item.name,
				cron: item.cron,
				enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
				last_run_at: typeof item.last_run_at === 'string' ? item.last_run_at : null,
				last_status,
				last_error: typeof item.last_error === 'string' ? item.last_error : null,
				created_at: typeof item.created_at === 'string' ? item.created_at : now,
				updated_at: typeof item.updated_at === 'string' ? item.updated_at : now
			}
		})

	return { version, tasks }
}
