import type { Editor } from '@tiptap/core'

type UploadImage = (() => Promise<string | null | undefined>) | undefined

export default async (editor: Editor, uploadImage: UploadImage) => {
	let url: string | null | undefined = ''

	if (uploadImage) {
		url = await uploadImage()
	} else {
		url = window.prompt('URL')
	}

	if (url) {
		editor.chain().focus().setImage({ src: url }).run()
	}
}
