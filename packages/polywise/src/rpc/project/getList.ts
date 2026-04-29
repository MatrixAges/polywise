import { getProjects, getProjectSessions } from '../../db/services'
import { p } from '../../utils/trpc'

const page_size = 6

export default p.query(async () => {
	const projects = await getProjects({ orderBy: 'asc' })

	return Promise.all(
		projects.map(async project => {
			const session_rows = await getProjectSessions({
				project_id: project.id,
				limit: page_size + 1
			})

			const has_more = session_rows.length > page_size
			const sessions = has_more ? session_rows.slice(0, page_size) : session_rows

			return { project, sessions: sessions.map(item => item.session), has_more }
		})
	)
})
