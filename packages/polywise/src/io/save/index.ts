import { article } from '@core/db/schema'

import saveArticle from './saveArticle'

type ArticleFor = NonNullable<(typeof article.$inferInsert)['for']>

interface ArgsSaveArticle {
	type: 'article'
	content: string
	for: ArticleFor
	id?: string
	scope_type?: 'global' | 'project' | 'agent'
	scope_id?: string | null
	source?: 'agent' | 'superego'
}

interface ArgsSaveDocument {
	type: 'document'
	file: File
	id?: string
}

type ArgsSave = ArgsSaveArticle | ArgsSaveDocument

export default async (args: ArgsSave) => {
	if (args.type === 'article') {
		return await saveArticle({
			content: args.content,
			for: args.for,
			article_id: args.id,
			scope_type: args.scope_type,
			scope_id: args.scope_id,
			source: args.source
		})
	}
	throw new Error('Unsupported save type')
}
