import { saveArticle } from '@core/io'
import { boolean, object, string, enum as zod_enum } from 'zod'

import { p } from '../utils/trpc'

const input_type = object({
	title: string().optional(),
	content: string(),
	for: zod_enum(['linkcase', 'wiki', 'memory', 'user']),
	save_origin: zod_enum(['message_bookmark']).optional(),
	exec_pipeline: boolean().optional()
})
const output_type = object({ ok: boolean(), id: string() })

export default p
	.meta({
		openapi: {
			method: 'POST',
			path: '/save',
			description: 'Create a new article or knowledge note from raw content.'
		}
	})
	.input(input_type)
	.output(output_type)
	.mutation(async ({ input }) => {
		const { title, content, for: for_type, save_origin, exec_pipeline } = input

		const id = await saveArticle({
			title,
			content,
			for: for_type,
			metadata: save_origin
				? {
						save_origin
					}
				: undefined,
			exec_pipeline
		})

		return { ok: true, id }
	})
