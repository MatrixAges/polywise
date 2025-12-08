import { getHeight } from '../util'

import type { Node } from '../types'

const positionNode = (
	node: Node,
	previousNode: Node,
	indent: ((n: Node) => number) | number,
	dropCap: boolean,
	align: 'center' | undefined,
	root: Node
) => {
	const displacementX = typeof indent === 'function' ? indent(node) : indent * node.depth

	if (!dropCap) {
		try {
			if (node.id === node.parent.children[0].id || node.id === root?.children?.[0]?.id) {
				node.x += displacementX
				node.y = previousNode ? previousNode.y : 0
				return
			}
		} catch (e) {
			// skip to normal when a node has no parent
		}
	}

	node.x += displacementX

	if (previousNode) {
		node.y = previousNode.y + getHeight(previousNode, node, align)

		if (previousNode.parent && node.parent.id !== previousNode.parent.id) {
			const prevParent = previousNode.parent
			const preY = prevParent.y + getHeight(prevParent, node, align)

			node.y = preY > node.y ? preY : node.y
		}
	} else {
		node.y = 0
	}

	return
}

export default (root: Node, indent: ((n: Node) => number) | number, dropCap: boolean, align: 'center' | undefined) => {
	let previousNode = null

	root.eachNode(node => {
		positionNode(node, previousNode, indent, dropCap, align, root)

		previousNode = node
	})
}
