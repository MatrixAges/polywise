import separateRoot from './separateRoot'

import type { Node, Options } from '../types'

const VALID_DIRECTIONS = ['LR', 'RL', 'TB', 'BT', 'H', 'V'] as const
const HORIZONTAL_DIRECTIONS = ['LR', 'RL', 'H']
const DEFAULT_DIRECTION = VALID_DIRECTIONS[0]

export type Direction = (typeof VALID_DIRECTIONS)[number]

const isHorizontal = (direction: Direction) => HORIZONTAL_DIRECTIONS.indexOf(direction) > -1

export default (root: Node, options: Options, layoutAlgrithm: (root: Node, options: Options) => void) => {
	const direction = options.direction || DEFAULT_DIRECTION

	options.isHorizontal = isHorizontal(direction)

	if (direction && VALID_DIRECTIONS.indexOf(direction) === -1) {
		throw new TypeError(`Invalid direction: ${direction}`)
	}

	if (direction === VALID_DIRECTIONS[0]) {
		layoutAlgrithm(root, options)
	} else if (direction === VALID_DIRECTIONS[1]) {
		layoutAlgrithm(root, options)

		root.right2left()
	} else if (direction === VALID_DIRECTIONS[2]) {
		layoutAlgrithm(root, options)
	} else if (direction === VALID_DIRECTIONS[3]) {
		layoutAlgrithm(root, options)

		root.bottom2top()
	} else if (direction === VALID_DIRECTIONS[4] || direction === VALID_DIRECTIONS[5]) {
		const { left, right } = separateRoot(root, options)

		layoutAlgrithm(left, options)
		layoutAlgrithm(right, options)

		options.isHorizontal ? left.right2left() : left.bottom2top()

		right.translate(left.x - right.x, left.y - right.y)

		root.x = left.x
		root.y = right.y

		const bb = root.getBoundingBox()

		if (options.isHorizontal) {
			if (bb.top < 0) {
				root.translate(0, -bb.top)
			}
		} else {
			if (bb.left < 0) {
				root.translate(-bb.left, 0)
			}
		}
	}

	let fixedRoot = options.fixedRoot

	if (fixedRoot === undefined) fixedRoot = true

	if (fixedRoot) {
		root.translate(-(root.x + root.width / 2 + root.hgap), -(root.y + root.height / 2 + root.vgap))
	}

	return root
}
