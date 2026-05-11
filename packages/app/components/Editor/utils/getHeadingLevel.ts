import { Editor } from '@tiptap/core'

export default (editor: Editor) => {
	for (let level = 1; level <= 6; level++) {
		if (editor.isActive('heading', { level })) {
			return level
		}
	}

	return null
}
