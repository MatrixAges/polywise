import { getProjects, getProjectSessions } from '../../db/services'
import { p } from '../../utils/trpc'

export default p.query(async () => {
	const projects = await getProjects({ orderBy: 'asc' })

	return Promise.all(
		projects.map(async project => {
			const sessions = await getProjectSessions({
				project_id: project.id,
				limit: 10
			})

			return {
				project,
				sessions
			}
		})
	)
})
