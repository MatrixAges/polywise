import { getProjects } from '../../db/services'
import { p } from '../../utils/trpc'

export default p.query(async () => {
	return getProjects({ orderBy: 'asc' })
})
