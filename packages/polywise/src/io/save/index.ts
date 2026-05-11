import { article } from '@core/db/schema'

import saveArticle from './saveArticle'
import saveDocument from './saveDocument'

type ArticleFor = NonNullable<(typeof article.$inferInsert)['for']>

interface ArgsSaveArticle {
	type: 'article'
	title?: string | null
	content: string
	for: ArticleFor
	id?: string
	scope_type?: 'global' | 'project' | 'agent'
	scope_id?: string | null
	source?: 'agent' | 'superego'
	exec_pipeline?: boolean
}

interface ArgsSaveDocument {
	type: 'document'
	file: File
	id?: string
	exec_pipeline?: boolean
}

type ArgsSave = ArgsSaveArticle | ArgsSaveDocument

export { saveArticle, saveDocument }

export default async (args: ArgsSave) => {
	if (args.type === 'article') {
		return await saveArticle({
			title: args.title,
			content: args.content,
			for: args.for,
			article_id: args.id,
			scope_type: args.scope_type,
			scope_id: args.scope_id,
			source: args.source,
			exec_pipeline: args.exec_pipeline
		})
	}

	if (args.type === 'document') {
		return await saveDocument({
			file: args.file,
			document_id: args.id,
			exec_pipeline: args.exec_pipeline
		})
	}

	throw new Error('Unsupported save type')
}
