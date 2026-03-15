import saveArticle from './saveArticle'

interface ArgsSaveArticle {
	type: 'article'
	content: string
}

interface ArgsSaveDocument {
	type: 'document'
	file: File
}

type ArgsSave = ArgsSaveArticle | ArgsSaveDocument

export default async (args: ArgsSave) => {
	if (args.type === 'article') {
		await saveArticle(args.content)
	}
}
