import { getAgents } from '@core/db/services'
import { p } from '@core/utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/agent/query',
			description:
				'Return all saved agents with their names, roles, descriptions, and full profiles. Use this to answer how many agents exist and what each agent is for.'
		}
	})
	.query(async () => {
		return getAgents()
	})
