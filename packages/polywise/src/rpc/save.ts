import { saveArticle } from '@core/io'
import { boolean, object, string, enum as zod_enum } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({
	content: string(),
	for: zod_enum(['linkcase', 'wiki', 'memory', 'user']),
	exec_pipeline: boolean().optional()
})
const output_type = object({ ok: boolean(), id: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/save',
			summary: 'Create an article'
		},
		cli: {
			group: ['article'],
			name: 'save',
			summary: 'Create an article.'
		}
	})
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		const { content, for: for_type, exec_pipeline } = input

		const id = await saveArticle({ content: content, for: for_type, exec_pipeline })

		return { ok: true, id }
	})
