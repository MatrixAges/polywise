import { p } from '../../utils/trpc'
import { listLinkcaseSchedules } from './scheduler'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/getSchedules',
			summary: 'Read Get Schedules'
		}
	})
	.query(async () => {
		return {
			tasks: await listLinkcaseSchedules()
		}
	})
