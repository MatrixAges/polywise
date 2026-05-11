import type { Editor } from '@tiptap/core'

export default (editor: Editor) => {
	const previousUrl = editor.getAttributes('link').href
	const url = window.prompt('URL', previousUrl)

	if (url === null) {
		return
	}

	if (url === '') {
		editor.chain().focus().extendMarkRange('link').unsetLink().run()

		return
	}

	try {
		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
	} catch (e: any) {
		alert(e?.message)
	}
}
