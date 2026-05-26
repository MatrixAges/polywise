import getMdastText from './getMdastText'

import type { Root } from 'mdast'

export default (ast: Root) => {
	const map = new Map<string, number>()

	ast.children.forEach(item => {
		if (item.type === 'heading') {
			const value = getMdastText(item.children)

			map.set(value, item.depth)
		}
	})

	return map
}
