import { mix } from '../util'

import type { Direction } from '../types'

export type Methods = Partial<typeof extend>

export interface NodeType extends Methods {
	id: string
	name?: string
	label?: string
	preH?: number
	preV?: number
	hgap?: number
	vgap?: number
	width?: number
	height?: number
	x?: number
	y?: number
	index?: number
	w?: number
	h?: number
	tl?: NodeType
	tr?: NodeType
	msel?: number
	mser?: number
	mod?: number
	low?: number
	shift?: number
	change?: number
	prelim?: number
	startY?: number
	depth?: number
	drawingDepth?: number
	collapsed?: boolean
	side?: 'left' | 'right'
	data?: any
	originNode?: NodeType
	parent?: NodeType
	el?: NodeType
	leftChild?: NodeType
	er?: NodeType
	rightChild?: NodeType
	c?: Array<NodeType>
	cs?: number
	children?: Array<NodeType>
	totalHeight?: number
	_subTreeSep?: number
	ih?: {
		low: number
		index: number
		nxt: NodeType['ih']
	}
	nxt?: NodeType['ih']
	[key: string]: any
}

export type Options = Partial<typeof DEFAULT_OPTIONS> & {
	direction?: Direction
	isHorizontal?: boolean
	forceCompact?: boolean
	fixedRoot?: boolean
	indent?: number
	dropCap?: boolean
	align?: 'center'
	getSubTreeSep?: (data?: any) => number
	getSide?: (child: NodeType, index: number) => 'left' | 'right'
}

const PEM = 18
const DEFAULT_HEIGHT = PEM * 2
const DEFAULT_GAP = PEM

const DEFAULT_OPTIONS = {
	getId(d: NodeType) {
		return d.id || d.name
	},
	getPreH(d: NodeType) {
		return d.preH || 0
	},
	getPreV(d: NodeType) {
		return d.preV || 0
	},
	getHGap(d: NodeType) {
		return d.hgap || DEFAULT_GAP
	},
	getVGap(d: NodeType) {
		return d.vgap || DEFAULT_GAP
	},
	getChildren(d: NodeType) {
		return d.children
	},
	getHeight(d: NodeType) {
		return d.height || DEFAULT_HEIGHT
	},
	getWidth(d: NodeType) {
		const label = d.label || ' '

		return d.width || label.split('').length * PEM
	}
} as const

function Node(node: NodeType, options: Options) {
	const me = this

	me.vgap = me.hgap = 0

	if (node instanceof Node) return node

	me.data = node

	const hgap = options.getHGap(node)
	const vgap = options.getVGap(node)

	me.id = options.getId(node)
	me.preH = options.getPreH(node)
	me.preV = options.getPreV(node)
	me.width = options.getWidth(node)
	me.height = options.getHeight(node)
	me.width += me.preH
	me.height += me.preV
	me.x = me.y = 0
	me.depth = 0

	if (!me.children) me.children = []

	me.addGap(hgap, vgap)

	return me
}

const extend = {
	isRoot() {
		return this.depth === 0
	},

	isLeaf() {
		return this.children.length === 0
	},

	addGap(hgap: number, vgap: number) {
		const me = this

		me.hgap += hgap
		me.vgap += vgap
		me.width += 2 * hgap
		me.height += 2 * vgap
	},

	eachNode(callback: (v: NodeType) => void) {
		const me = this
		let nodes = [me]
		let current = null as NodeType

		while ((current = nodes.shift())) {
			callback(current)

			nodes = current.children.concat(nodes)
		}
	},

	DFTraverse(callback: (v: NodeType) => void) {
		this.eachNode(callback)
	},

	BFTraverse(callback: (v: NodeType) => void) {
		const me = this
		let nodes = [me]
		let current = null as NodeType

		while ((current = nodes.shift())) {
			callback(current)

			nodes = nodes.concat(current.children)
		}
	},

	getBoundingBox() {
		const bb = {
			left: Number.MAX_VALUE,
			top: Number.MAX_VALUE,
			width: 0,
			height: 0
		}

		this.eachNode((node: NodeType) => {
			bb.left = Math.min(bb.left, node.x)
			bb.top = Math.min(bb.top, node.y)
			bb.width = Math.max(bb.width, node.x + node.width)
			bb.height = Math.max(bb.height, node.y + node.height)
		})

		return bb
	},

	translate(tx = 0, ty = 0) {
		this.eachNode((node: NodeType) => {
			node.x += tx
			node.y += ty
			node.x += node.preH
			node.y += node.preV
		})
	},

	right2left() {
		const me = this
		const bb = me.getBoundingBox()

		me.eachNode((node: NodeType) => {
			node.x = node.x - (node.x - bb.left) * 2 - node.width
		})

		me.translate(bb.width, 0)
	},

	bottom2top() {
		const me = this
		const bb = me.getBoundingBox()

		me.eachNode((node: NodeType) => {
			node.y = node.y - (node.y - bb.top) * 2 - node.height
		})

		me.translate(0, bb.height)
	}
}

mix(Node.prototype, extend)

export const hierarchy = (data: NodeType, options = {} as Options, isolated?: boolean) => {
	options = mix(DEFAULT_OPTIONS, options)

	// @ts-ignore
	const root = new Node(data, options)
	const nodes = [root]

	let node = null as NodeType

	if (!isolated && !data.collapsed) {
		while ((node = nodes.shift())) {
			if (!node.data.collapsed) {
				const children = options.getChildren(node.data)
				const length = children ? children.length : 0

				node.children = new Array(length)

				if (children && length) {
					for (let i = 0; i < length; i++) {
						// @ts-ignore
						const child = new Node(children[i], options)

						node.children[i] = child

						nodes.push(child)

						child.parent = node
						child.depth = node.depth + 1
					}
				}
			}
		}
	}

	return root as NodeType
}
