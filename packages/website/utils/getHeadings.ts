import type { Root, Text } from 'mdast'

export default (ast: Root) => {
	const map = new Map()

	ast.children.forEach(item => {
		if (item.type === 'heading') {
			const { value } = item.children[0] as Text

			map.set(value, item.depth)
		}
	})

	return map
}
