import { getReportRuntime } from '@core/report'
import { p } from '@core/utils'
import { enum as Enum, number, object } from 'zod'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/report/trigger',
			summary: 'Trigger report generation'
		}
	})
	.input(
		object({
			period: Enum(['day', 'week', 'month', 'year']),
			offset: number().int().min(0).optional()
		})
	)
	.mutation(async ({ input }) => {
		void getReportRuntime().runNow({
			period: input.period,
			offset: input.offset ?? 0
		})

		return getReportRuntime().getStatus()
	})
