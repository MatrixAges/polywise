import { ReactNodeViewRenderer } from '@tiptap/react'

import Component from './Component'
import CodeBlock from './vendor'

export default CodeBlock.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			theme: {
				default: null,
				rendered: false
			}
		}
	},
	addNodeView() {
		return ReactNodeViewRenderer(Component, { contentDOMElementTag: 'code' })
	},
	addKeyboardShortcuts() {
		return {
			...this.parent?.(),
			Backspace: () => {
				const { empty, $anchor } = this.editor.state.selection

				if (!empty || $anchor.parent.type.name !== this.name) {
					return false
				}

				const start = $anchor.parentOffset === 0
				const size = $anchor.parent.content.size

				if (start && (size === 0 || size === 1)) {
					const from = $anchor.start()
					const to = $anchor.end()

					return this.editor.chain().focus().deleteRange({ from, to }).setParagraph().run()
				}

				return false
			}
		}
	}
})
