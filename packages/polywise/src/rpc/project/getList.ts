import { getProjects } from '../../db/services'
import { p } from '../../utils/trpc'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/project/getList',
			summary: 'Read Get List'
		}
	})
	.query(async () => {
		const projects = await getProjects({ orderBy: 'asc' })

		return projects.map(project => ({ project, sessions: [], has_more: false }))
	})
