import { getSnifferStatuses } from '@core/sniffer'

import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/sniffer/status',
			description: 'Return bookmark sniffer availability across supported browsers.'
		}
	})
	.query(async () => ({
		browsers: await getSnifferStatuses()
	}))
