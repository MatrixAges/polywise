import { getSkills } from '@core/db/services'
import { p } from '@core/utils'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/skill/query',
			description: 'List all installed skills with metadata.'
		}
	})
	.query(async () => {
		return getSkills()
	})
