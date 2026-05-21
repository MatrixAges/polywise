import { getSnifferStatuses } from '@core/sniffer'

import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/sniffer/status',
			summary: 'Read Status'
		}
	})
	.query(async () => ({
		browsers: await getSnifferStatuses()
	}))
