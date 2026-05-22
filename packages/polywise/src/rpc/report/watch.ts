import events from 'events'
import { getReportRuntime, report_status_emitter } from '@core/report'
import { p } from '@core/utils'

export default p.subscription(async function* (args) {
	const { signal } = args

	yield await getReportRuntime().getStatus()

	for await (const [data] of events.on(report_status_emitter, 'change', { signal })) {
		yield data
	}
})
