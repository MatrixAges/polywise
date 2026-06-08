import { requestPipelineTaskCancel } from '@core/io/save/pipelineStore'
import { p } from '@core/utils'
import { object, string } from 'zod'

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/pipeline/cancel',
			description: 'Request cancellation for one active pipeline task.'
		}
	})
	.input(
		object({
			article_id: string()
		})
	)
	.mutation(async ({ input }) => {
		return requestPipelineTaskCancel(input.article_id)
	})
