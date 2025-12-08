import { mix } from '../util'

import type { Node, Options } from '../types'

export type CurrentOptions = typeof DEFAULT_OPTIONS & Options

function WrappedTree(height = 0, children = []) {
	const me = this

	me.x = me.y = 0
	me.leftChild = me.rightChild = null
	me.height = 0
	me.children = children
}

const DEFAULT_OPTIONS = {
	isHorizontal: true,
	nodeSep: 20,
	nodeSize: 20,
	rankSep: 200,
	subTreeSep: 10
}

function convertBack(converted: Node, root: Node, isHorizontal: boolean) {
	if (isHorizontal) {
		root.x = converted.x
		root.y = converted.y
	} else {
		root.x = converted.y
		root.y = converted.x
	}

	converted.children.forEach((child, i) => {
		convertBack(child, root.children[i], isHorizontal)
	})
}

export default (root: Node, options = {} as CurrentOptions) => {
	options = mix({} as CurrentOptions, DEFAULT_OPTIONS, options)

	let maxDepth = 0

	function wrappedTreeFromNode(n: Node) {
		if (!n) return null

		n.width = 0

		if (n.depth && n.depth > maxDepth) {
			maxDepth = n.depth
		}

		const children = n.children
		const childrenCount = children.length

		const t = new WrappedTree(n.height, [])

		children.forEach((child: Node, i: number) => {
			const childWT = wrappedTreeFromNode(child)

			t.children.push(childWT)

			if (i === 0) {
				t.leftChild = childWT
			}

			if (i === childrenCount - 1) {
				t.rightChild = childWT
			}
		})

		t.originNode = n
		t.isLeaf = n.isLeaf()

		return t as Node
	}

	function getDrawingDepth(t: Node) {
		if (t.isLeaf || t.children.length === 0) {
			t.drawingDepth = maxDepth
		} else {
			const depths = t.children.map(child => getDrawingDepth(child))
			const minChildDepth = Math.min.apply(null, depths)

			t.drawingDepth = minChildDepth - 1
		}

		return t.drawingDepth
	}

	let prevLeaf = null as Node

	function position(t: Node) {
		t.x = t.drawingDepth * options.rankSep

		if (t.isLeaf) {
			t.y = 0

			if (prevLeaf) {
				t.y = prevLeaf.y + prevLeaf.height + options.nodeSep

				if (t.originNode.parent !== prevLeaf.originNode.parent) {
					t.y += options.subTreeSep
				}
			}

			prevLeaf = t
		} else {
			t.children.forEach(child => {
				position(child)
			})

			t.y = (t.leftChild.y + t.rightChild.y) / 2
		}
	}

	const wt = wrappedTreeFromNode(root)

	getDrawingDepth(wt)
	position(wt)
	convertBack(wt, root, options.isHorizontal)

	return root
}
