import { hierarchy } from './hierarchy'

import type { Node, Options } from '../types'

export default class Tree {
	rootNode = null as Node
	options = {} as Options

	constructor(root: Node, options = {} as Options) {
		this.options = options
		this.rootNode = hierarchy(root, options)
	}

	execute() {
		throw new Error('please override this method')
	}
}
