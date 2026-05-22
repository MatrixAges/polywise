import events from 'events'
import { log } from '@core/utils'
import fs from 'fs-extra'

import { buildReportAnalytics } from './analytics'
import { readReportStatus, writeReportStatus } from './status'
import {
	buildReportAnalysisMarkdown,
	buildReportMetricsMarkdown,
	buildReportPlan,
	buildReportPreamble,
	synthesizeTopicSummary
} from './synthesize'
import {
	clampReportOffset,
	formatReportStageLabel,
	getDefaultReportStatus,
	getReportWindow,
	report_dir,
	report_plan_path
} from './utils'

import type { ReportPeriod, ReportQueryResult, ReportRuntime, ReportStatus } from './types'

export const report_status_emitter = new events.EventEmitter()

let runtime_instance: ReportRuntime | null = null

const emitStatus = (status: ReportStatus) => {
	report_status_emitter.emit('change', { ...status })
}

const createRuntime = (): ReportRuntime => {
	let status = getDefaultReportStatus()
	let status_loaded = false

	const ensureLoaded = async () => {
		if (status_loaded) {
			return
		}

		status = await readReportStatus()
		status_loaded = true
	}

	const persistStatus = async () => {
		status.updated_at = Date.now()
		await writeReportStatus(status).catch(() => null)
		emitStatus(status)
	}

	const setStatus = async (patch: Partial<ReportStatus>) => {
		status = {
			...status,
			...patch,
			updated_at: Date.now()
		}
		await persistStatus()
	}

	const readQuery = async (period: ReportPeriod, offset = 0): Promise<ReportQueryResult> => {
		await ensureLoaded()

		const window = getReportWindow(period, clampReportOffset(offset))
		const exists = await fs.pathExists(window.file_path)
		const content = exists ? await fs.readFile(window.file_path, 'utf8') : ''
		const updated_at = exists ? (await fs.stat(window.file_path)).mtimeMs : 0

		return {
			window,
			exists,
			content,
			path: window.file_path,
			updated_at,
			status
		}
	}

	const runNow = async (args: { period: ReportPeriod; offset?: number; force?: boolean }) => {
		await ensureLoaded()

		if (status.running && !args.force) {
			return status
		}

		const period = args.period
		const offset = clampReportOffset(args.offset)
		const window = getReportWindow(period, offset)

		await fs.ensureDir(report_dir)
		await setStatus({
			running: true,
			period,
			key: window.key,
			label: window.label,
			stage: 'preparing',
			detail: formatReportStageLabel(period),
			progress: 0.05,
			error: '',
			report_path: window.file_path,
			plan_path: period === 'day' ? '' : report_plan_path
		})

		try {
			const analytics = await buildReportAnalytics({ period, offset })

			if (period !== 'day') {
				await setStatus({
					stage: 'planning',
					detail: 'Writing temporary execution plan',
					progress: 0.12
				})
				await fs.writeFile(report_plan_path, buildReportPlan({ analytics }), 'utf8')
			}

			const exists = await fs.pathExists(window.file_path)

			await setStatus({
				stage: 'snapshot',
				detail: 'Writing metrics scaffold',
				progress: 0.22
			})

			const scaffold_block = [
				buildReportPreamble({ analytics, incremental: exists }),
				buildReportMetricsMarkdown({ analytics })
			]
				.filter(Boolean)
				.join('\n\n')

			if (exists) {
				await fs.appendFile(window.file_path, `\n\n---\n\n${scaffold_block}`, 'utf8')
			} else {
				await fs.writeFile(window.file_path, scaffold_block, 'utf8')
			}

			const topics = await synthesizeTopicSummary({
				period,
				analytics,
				onProgress: async (detail, progress) => {
					await setStatus({
						stage: 'analysis',
						detail,
						progress
					})
				}
			})

			await setStatus({
				stage: 'writing',
				detail: 'Appending synthesized analysis',
				progress: 0.9
			})
			const analysis_block = buildReportAnalysisMarkdown({ analytics, topics })
			await fs.appendFile(window.file_path, `\n\n${analysis_block}`, 'utf8')

			if (period !== 'day') {
				await fs.remove(report_plan_path).catch(() => null)
			}

			await setStatus({
				running: false,
				stage: 'idle',
				detail: 'Report ready',
				progress: 1,
				error: '',
				last_completed_at: Date.now(),
				plan_path: ''
			})

			return status
		} catch (error) {
			log('SYSTEM', 'reportRuntimeError', () => (error instanceof Error ? error.message : String(error)))

			await setStatus({
				running: false,
				stage: 'error',
				detail: 'Report generation failed',
				progress: 0,
				error: error instanceof Error ? error.message : String(error)
			})
			throw error
		}
	}

	return {
		getStatus: async () => {
			await ensureLoaded()

			return status
		},
		query: async args => readQuery(args.period, args.offset ?? 0),
		runNow
	}
}

export const getReportRuntime = () => {
	if (!runtime_instance) {
		runtime_instance = createRuntime()
	}

	return runtime_instance
}
