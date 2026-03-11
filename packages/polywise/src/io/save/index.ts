interface ArgsSaveArticle {
	type: 'article'
	text: string
}

interface ArgsSaveDocument {
	type: 'document'
	file: File
}

type ArgsSave = ArgsSaveArticle | ArgsSaveDocument

export default async (args: ArgsSave) => {}
