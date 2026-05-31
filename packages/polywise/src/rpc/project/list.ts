import { array } from 'zod'

import { project_select_schema } from '../../db/schemas'
import { getProjects } from '../../db/services'
import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/project/list',
			description: 'List all projects in ascending order.'
		}
	})
	.output(array(project_select_schema))
	.query(async () => {
		return getProjects({ orderBy: 'asc' })
	})
