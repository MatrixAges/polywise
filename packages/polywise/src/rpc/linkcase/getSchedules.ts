import { p } from '../../utils/trpc'
import { listLinkcaseSchedules } from './scheduler'

export default p.query(async () => {
	return {
		tasks: await listLinkcaseSchedules()
	}
})
