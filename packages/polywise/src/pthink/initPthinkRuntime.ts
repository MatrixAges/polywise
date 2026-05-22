import { env } from '@core/env'

import { defaultPthinkStatus } from './status'

export default async () => {
	env.pthink = {
		monitor_timer: null,
		daily_job: null,
		weekly_job: null,
		status: defaultPthinkStatus(),
		start: async () => {},
		stop: async () => {},
		runNow: async () => null,
		touchForeground: () => {},
		touchVisit: () => {}
	}
}
