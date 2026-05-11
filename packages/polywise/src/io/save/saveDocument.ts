import { document } from '@core/db/schema'
import { addDocument, getDocument, setDocument } from '@core/db/services'
import { eq } from 'drizzle-orm'

interface ArgsSaveDocument {
	file: File
	document_id?: string
	exec_pipeline?: boolean
}

export default async (args: ArgsSaveDocument) => {
	const title = args.file.name || 'Untitled'

	if (args.document_id) {
		const existing_document = await getDocument(eq(document.id, args.document_id))

		if (!existing_document) {
			throw new Error(`Document not found: ${args.document_id}`)
		}

		await setDocument(eq(document.id, args.document_id), {
			title,
			is_pipelined: false,
			updated_at: new Date()
		})

		return args.document_id
	}

	const document_item = await addDocument({
		title,
		is_pipelined: false
	})

	return document_item.id
}
