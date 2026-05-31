import { getReportRuntime } from '@core/report'
import { p } from '@core/utils'
import { enum as Enum, number, object } from 'zod'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/report/query',
			description: 'Read report window'
		}
	})
	.input(
		object({
			period: Enum(['day', 'week', 'month', 'year']),
			offset: number().int().min(0).optional()
		})
	)
	.query(async ({ input }) => {
		return getReportRuntime().query({
			period: input.period,
			offset: input.offset ?? 0
		})
	})
