import { addAgentArticle } from '@core/db/services/externals'
import save from '@core/io/save'
import { object, string, enum as zod_enum } from 'zod'

import { p } from '../../utils/trpc'

const input_type = object({
	agent_id: string(),
	content: string(),
	for: zod_enum(['linkcase', 'wiki', 'memory', 'user'])
})

export default p.input(input_type).mutation(async ({ input }) => {
	const article_id = await save({
		type: 'article',
		content: input.content,
		for: input.for,
		scope_type: 'agent',
		scope_id: input.agent_id
	})

	await addAgentArticle(input.agent_id, article_id)

	return article_id
})
