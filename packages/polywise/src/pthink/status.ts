import path from 'path'
import { app } from '@core/consts'
import { writeFile } from 'atomically'
import fs from 'fs-extra'

import type { PthinkRuntimeStatus } from './types'

export const defaultPthinkStatus = (): PthinkRuntimeStatus => ({
	running: false,
	last_run_at: null,
	last_report_at: null,
	last_review_at: null,
	last_status: 'idle',
	last_error: null,
	last_reason: null,
	last_summary: null,
	boot_at: Date.now(),
	last_foreground_at: Date.now(),
	last_visit_at: Date.now(),
	report_history: [],
	trigger_last_fired: {}
})

export const readPthinkStatus = async () => {
	try {
		const raw = await fs.readJson(app.pthink_path)

		return {
			...defaultPthinkStatus(),
			...(raw && typeof raw === 'object' ? raw : {}),
			last_review_at:
				typeof raw?.last_review_at === 'number'
					? raw.last_review_at
					: typeof raw?.last_report_at === 'number'
						? raw.last_report_at
						: null,
			report_history: Array.isArray(raw?.report_history) ? raw.report_history : [],
			trigger_last_fired:
				raw?.trigger_last_fired && typeof raw.trigger_last_fired === 'object'
					? raw.trigger_last_fired
					: {}
		} as PthinkRuntimeStatus
	} catch {
		return defaultPthinkStatus()
	}
}

export const writePthinkStatus = async (status: PthinkRuntimeStatus) => {
	await fs.ensureDir(path.dirname(app.pthink_path))
	await writeFile(app.pthink_path, JSON.stringify(status, null, 4), 'utf8')
}
