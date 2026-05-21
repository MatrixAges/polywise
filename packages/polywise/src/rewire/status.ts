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
	last_foreground_at: Date.now()
})

export const readRewireStatus = async () => {
	try {
		const raw = await fs.readJson(app.rewire_path)

		return {
			...default_status(),
			...(raw && typeof raw === 'object' ? raw : {})
		} as RewireRuntimeStatus
	} catch {
		return default_status()
	}
}

export const writeRewireStatus = async (status: RewireRuntimeStatus) => {
	await fs.ensureDir(path.dirname(app.rewire_path))
	await writeFile(app.rewire_path, JSON.stringify(status, null, 4), 'utf8')
}
