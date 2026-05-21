import { getSkills } from '@core/db/services'
import { p } from '@core/utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/skill/query',
			summary: 'Read Query'
		}
	})
	.query(async () => {
		return getSkills()
	})
