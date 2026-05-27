import { log } from '@core/utils'

import { getReportRuntime } from './runtime'

const report_monitor_ms = 60_000
let report_monitor_timer: NodeJS.Timeout | null = null

export default async () => {
	if (report_monitor_timer) {
		return
	}

	const runtime = getReportRuntime()
	const runMonitor = () => {
		void runtime.runScheduled().catch(error => {
			log('SYSTEM', 'reportMonitorError', () => (error instanceof Error ? error.message : String(error)))
		})
	}

	report_monitor_timer = setInterval(runMonitor, report_monitor_ms)
	report_monitor_timer.unref?.()

	await runtime.runScheduled().catch(error => {
		log('SYSTEM', 'reportMonitorBootstrapError', () => (error instanceof Error ? error.message : String(error)))
	})
}
