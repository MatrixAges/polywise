import type { Editor } from '@tiptap/core'
import type { IProps } from '..'

export default async (editor: Editor, uploadImage: IProps['uploadImage']) => {
	let url = '' as string | null

	if (uploadImage) {
		url = await uploadImage()
	} else {
		url = window.prompt('URL')
	}

	if (url) {
		editor.chain().focus().setImage({ src: url }).run()
	}
}
