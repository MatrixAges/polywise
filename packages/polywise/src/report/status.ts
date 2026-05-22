import path from 'path'
import { writeFile } from 'atomically'
import fs from 'fs-extra'

import { getDefaultReportStatus, report_status_path } from './utils'

import type { ReportStatus } from './types'

export const readReportStatus = async () => {
	try {
		const raw = await fs.readJson(report_status_path)

		return {
			...getDefaultReportStatus(),
			...(raw && typeof raw === 'object' ? raw : {})
		} as ReportStatus
	} catch {
		return getDefaultReportStatus()
	}
}

export const writeReportStatus = async (status: ReportStatus) => {
	await fs.ensureDir(path.dirname(report_status_path))
	await writeFile(report_status_path, JSON.stringify(status, null, 4), 'utf8')
}
