import { array } from 'zod'

import { project_select_schema } from '../../db/schemas'
import { getProjects } from '../../db/services'
import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'GET',
			path: '/project/list',
			summary: 'List projects'
		}
	})
	.output(array(project_select_schema))
	.query(async () => {
		return getProjects({ orderBy: 'asc' })
	})
