import { p } from '../../utils/trpc'
import { listLinkcaseSchedules } from './scheduler'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/linkcase/getSchedules',
			description: 'List configured linkcase schedules.'
		}
	})
	.query(async () => {
		return {
			tasks: await listLinkcaseSchedules()
		}
	})
