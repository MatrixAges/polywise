import { getAgents } from '@core/db/services'
import { p } from '@core/utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/query',
			summary: 'Read Query'
		}
	})
	.query(async () => {
		return getAgents()
	})
