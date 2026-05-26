import { isValidElement } from 'react'

import type { ReactNode } from 'react'

const getReactNodeText = (node: ReactNode): string => {
	if (node == null || typeof node === 'boolean') return ''

	if (typeof node === 'string' || typeof node === 'number') {
		return String(node)
	}

	if (Array.isArray(node)) {
		return node.map(item => getReactNodeText(item)).join('')
	}

	if (isValidElement(node)) {
		return getReactNodeText(node.props.children)
	}

	return ''
}

export default getReactNodeText
