import { Editor } from '@tiptap/core'

export default (editor: Editor) => {
	return (
		(editor.isActive('bulletList') && 'bullet') ||
		(editor.isActive('orderedList') && 'number') ||
		(editor.isActive('taskList') && 'check')
	)
}
