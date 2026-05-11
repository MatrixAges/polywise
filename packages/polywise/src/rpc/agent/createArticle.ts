import { addAgentArticle } from '@core/db/services/externals'
import { saveArticle } from '@core/io'
import { boolean, object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	agent_id: string(),
	title: string(),
	content: string(),
	for: zod_enum(['linkcase', 'wiki', 'memory', 'user']),
	exec_pipeline: boolean().optional()
})

export default p.input(input_type).mutation(async ({ input }) => {
	const article_id = await saveArticle({
		title: input.title,
		content: input.content,
		for: input.for,
		scope_type: 'agent',
		scope_id: input.agent_id,
		exec_pipeline: input.exec_pipeline
	})

	await addAgentArticle(input.agent_id, article_id)

	return article_id
})
