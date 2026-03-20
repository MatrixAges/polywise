import saveArticle from './saveArticle'

interface ArgsSaveArticle {
	type: 'article'
	content: string
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
		return await saveArticle(args.content, args.id)
	}
	throw new Error('Unsupported save type')
}
