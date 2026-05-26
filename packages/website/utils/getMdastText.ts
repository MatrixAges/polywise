import type { Nodes } from 'mdast'

const getMdastText = (node?: Nodes | Nodes[]): string => {
	if (!node) return ''

	if (Array.isArray(node)) {
		return node.map(item => getMdastText(item)).join('')
	}

	if ('value' in node && typeof node.value === 'string') {
		return node.value
	}

	if ('children' in node && Array.isArray(node.children)) {
		return node.children.map(item => getMdastText(item as Nodes)).join('')
	}

	return ''
}

export default getMdastText
