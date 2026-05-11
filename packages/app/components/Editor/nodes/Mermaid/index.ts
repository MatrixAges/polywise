import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import Component from './Component'

export default Node.create({
	name: 'mermaid',
	group: 'block',
	atom: true,
	addAttributes() {
		return {
			value: null
		}
	},
	addCommands() {
		return {
			insertMermaid:
				options =>
				({ editor, tr }) => {
					const value = options.value

					const from = options?.pos ?? editor.state.selection.from

					if (!value) return false

					tr.replaceWith(from, from, this.type.create({ value }))

					return true
				},
			updateMermaid:
				options =>
				({ editor, tr }) => {
					const value = options.value
					let pos = options?.pos

					if (pos === undefined) {
						pos = editor.state.selection.$from.pos
					}

					const node = editor.state.doc.nodeAt(pos)

					if (!node || node.type.name !== this.name) {
						return false
					}

					tr.setNodeMarkup(pos, this.type, { ...node.attrs, value })

					return true
				}
		}
	},
	addNodeView() {
		return ReactNodeViewRenderer(Component)
	},
	parseHTML() {
		return [{ tag: 'mermaid' }]
	},
	renderHTML({ HTMLAttributes }) {
		return ['mermaid', mergeAttributes(HTMLAttributes)]
	}
})

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		mermaid: {
			insertMermaid: (options: { value: string; pos?: number }) => ReturnType
			updateMermaid: (options: { value: string; pos?: number }) => ReturnType
		}
	}
}
