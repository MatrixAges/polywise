import { indented, separateRoot, Tree } from './layout'
import { mix } from './util'

import type { Node, Options } from './types'

const VALID_DIRECTIONS = ['LR', 'RL', 'H']
const DEFAULT_DIRECTION = VALID_DIRECTIONS[0]

class Index extends Tree {
	execute() {
		const me = this
		const options = me.options
		const root = me.rootNode

		options.isHorizontal = true

		const { indent = 20, dropCap = true, direction = DEFAULT_DIRECTION, align } = options

		if (direction && VALID_DIRECTIONS.indexOf(direction) === -1) {
			throw new TypeError(`Invalid direction: ${direction}`)
		}

		if (direction === VALID_DIRECTIONS[0]) {
			indented(root, indent, dropCap, align)
		} else if (direction === VALID_DIRECTIONS[1]) {
			indented(root, indent, dropCap, align)

			root.right2left()
		} else if (direction === VALID_DIRECTIONS[2]) {
			const { left, right } = separateRoot(root, options)

			indented(left, indent, dropCap, align)

			left.right2left()

			indented(right, indent, dropCap, align)

			const bbox = left.getBoundingBox()

			right.translate(bbox.width, 0)

			root.x = right.x - root.width / 2
		}

		return root
	}
}

export default (root: Node, options: Options) => {
	return new Index(root, mix({} as any, {}, options)).execute()
}
