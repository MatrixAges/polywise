import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import Component from './Component'

export default Node.create({
	name: 'test',
	group: 'block',
	atom: true,
	addAttributes() {
		return {
			count: {
				default: 0
			}
		}
	},
	addNodeView() {
		return ReactNodeViewRenderer(Component)
	},
	parseHTML() {
		return [
			{
				tag: 'test'
			}
		]
	},
	renderHTML({ HTMLAttributes }) {
		return ['test', mergeAttributes(HTMLAttributes)]
	}
})
