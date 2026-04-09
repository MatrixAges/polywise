import { article } from '@core/db/schema'

import saveArticle from './saveArticle'

type ArticleFor = NonNullable<(typeof article.$inferInsert)['for']>

interface ArgsSaveArticle {
	type: 'article'
	content: string
	for: ArticleFor
	id?: string
}

interface ArgsSaveDocument {
	type: 'document'
	file: File
	id?: string
}

type ArgsSave = ArgsSaveArticle | ArgsSaveDocument

export default async (args: ArgsSave) => {
	if (args.type === 'article') {
		return await saveArticle({ content: args.content, for: args.for, article_id: args.id })
	}
	throw new Error('Unsupported save type')
}
