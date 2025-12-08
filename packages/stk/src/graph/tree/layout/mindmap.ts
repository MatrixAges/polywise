import { mix } from '../util'

import type { Node, Options } from '../types'

function secondWalk(node: Node, options: Options) {
	let totalHeight = 0

	if (!node.children.length) {
		totalHeight = node.height
	} else {
		node.children.forEach(c => {
			totalHeight += secondWalk(c, options)
		})
	}

	node._subTreeSep = options.getSubTreeSep(node.data)
	node.totalHeight = Math.max(node.height, totalHeight) + 2 * node._subTreeSep

	return node.totalHeight
}

function thirdWalk(node: Node) {
	const children = node.children
	const len = children.length

	if (len) {
		children.forEach(c => {
			thirdWalk(c)
		})

		const first = children[0]
		const last = children[len - 1]
		const childrenHeight = last.y - first.y + last.height

		let childrenTotalHeight = 0

		children.forEach(child => {
			childrenTotalHeight += child.totalHeight
		})

		if (childrenHeight > node.height) {
			node.y = first.y + childrenHeight / 2 - node.height / 2
		} else if (children.length !== 1 || node.height > childrenTotalHeight) {
			const offset = node.y + (node.height - childrenHeight) / 2 - first.y

			children.forEach(c => {
				c.translate(0, offset)
			})
		} else {
			node.y = (first.y + first.height / 2 + last.y + last.height / 2) / 2 - node.height / 2
		}
	}
}

const DEFAULT_OPTIONS = {
	getSubTreeSep() {
		return 0
	}
}

export default (root: Node, options = {} as Options) => {
	options = mix({} as any, DEFAULT_OPTIONS, options)

	root.parent = {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	} as Node

	root.BFTraverse(node => {
		node.x = node.parent.x + node.parent.width
	})

	root.parent = null

	secondWalk(root, options)

	root.startY = 0
	root.y = root.totalHeight / 2 - root.height / 2

	root.eachNode(node => {
		const children = node.children
		const len = children.length

		if (len) {
			const first = children[0]

			first.startY = node.startY + node._subTreeSep

			if (len === 1) {
				first.y = node.y + node.height / 2 - first.height / 2
			} else {
				first.y = first.startY + first.totalHeight / 2 - first.height / 2

				for (let i = 1; i < len; i++) {
					const c = children[i]

					c.startY = children[i - 1].startY + children[i - 1].totalHeight
					c.y = c.startY + c.totalHeight / 2 - c.height / 2
				}
			}
		}
	})

	thirdWalk(root)
}
