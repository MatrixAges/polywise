import { saveArticle } from '@core/io'
import { boolean, object, string, enum as zod_enum } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({
	id: string(),
	content: string(),
	for: zod_enum(['linkcase', 'wiki', 'memory', 'user']),
	exec_pipeline: boolean().optional()
})
const output_type = object({ ok: boolean(), id: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/update',
			description: 'Update an existing article or knowledge note by id.'
		}
	})
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		const { id, content, for: for_type, exec_pipeline } = input

		const updated_id = await saveArticle({
			content: content,
			for: for_type,
			article_id: id,
			exec_pipeline
		})

		return { ok: true, id: updated_id }
	})
