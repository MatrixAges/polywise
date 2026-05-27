import { randomUUID } from 'crypto'
import path from 'path'
import { app } from '@core/consts'
import { writeFile } from 'atomically'
import fs from 'fs-extra'

import type { RewireRuntimeStatus } from './types'

const default_status = (): RewireRuntimeStatus => ({
	running: false,
	last_cycle_at: null,
	last_status: 'idle',
	last_error: null,
	last_summary: null,
	last_foreground_at: Date.now(),
	last_visit_at: Date.now()
})

const legacy_rewire_path = path.resolve(app.app_path, 'rewire.json')
const mistaken_rewire_path = path.resolve(app.app_path, 'app_dir', 'rewire', 'status.json')
const rewire_temp_dir = path.resolve(app.temp_dir, 'rewire')

const readStatusFile = async (file_path: string) => {
	try {
		const raw = await fs.readJson(file_path)

		return {
			...default_status(),
			...(raw && typeof raw === 'object' ? raw : {})
		} as RewireRuntimeStatus
	} catch {
		return null
	}
}

const cleanupTempFiles = async (dir_path: string, file_name: string) => {
	try {
		const entries = await fs.readdir(dir_path)
		const prefix = `${file_name}.tmp-`

		await Promise.all(
			entries
				.filter(entry_name => entry_name.startsWith(prefix))
				.map(entry_name => fs.remove(path.resolve(dir_path, entry_name)))
		)
	} catch {
		return
	}
}

const createTempPath = (file_path: string) =>
	path.resolve(rewire_temp_dir, `${path.basename(file_path)}.tmp-${Date.now()}${randomUUID().replaceAll('-', '')}`)

export const readRewireStatus = async () => {
	const current = await readStatusFile(app.rewire_path)

	if (current) {
		return current
	}

	const legacy = await readStatusFile(legacy_rewire_path)

	if (legacy) {
		return legacy
	}

	const mistaken = await readStatusFile(mistaken_rewire_path)

	return mistaken ?? default_status()
}

export const writeRewireStatus = async (status: RewireRuntimeStatus) => {
	await fs.ensureDir(path.dirname(app.rewire_path))
	await fs.ensureDir(rewire_temp_dir)
	// Stale temp files can be left behind by abrupt process termination.
	await cleanupTempFiles(path.dirname(legacy_rewire_path), path.basename(legacy_rewire_path))
	await cleanupTempFiles(rewire_temp_dir, path.basename(app.rewire_path))
	await writeFile(app.rewire_path, JSON.stringify(status, null, 4), {
		encoding: 'utf8',
		tmpCreate: createTempPath
	})
	await fs.remove(legacy_rewire_path).catch(() => null)
	await fs.remove(mistaken_rewire_path).catch(() => null)
	await cleanupTempFiles(path.dirname(legacy_rewire_path), path.basename(legacy_rewire_path))
}
