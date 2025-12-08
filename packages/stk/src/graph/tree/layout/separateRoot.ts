import { hierarchy } from './hierarchy'

import type { Node, Options } from '../types'

export default (root: Node, options: Options) => {
	const left = hierarchy(root.data, options, true)
	const right = hierarchy(root.data, options, true)
	const treeSize = root.children.length
	const rightTreeSize = Math.round(treeSize / 2)

	const getSide = options.getSide || ((_: Node, index: number) => (index < rightTreeSize ? 'right' : 'left'))

	for (let i = 0; i < treeSize; i++) {
		const child = root.children[i]
		const side = getSide(child, i)

		if (side === 'right') {
			right.children.push(child)
		} else {
			left.children.push(child)
		}
	}

	left.eachNode(node => {
		if (!node.isRoot()) {
			node.side = 'left'
		}
	})

	right.eachNode(node => {
		if (!node.isRoot()) {
			node.side = 'right'
		}
	})

	return { left, right }
}
