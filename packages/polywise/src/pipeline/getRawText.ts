import processor from './processor'

import type { Root, RootContent } from 'mdast'

export default (nodes: Array<RootContent>, original_text: string) => {
	if (nodes.length === 0) return ''

	const first_node = nodes[0]
	const last_node = nodes[nodes.length - 1]
	const start_offset = first_node.position?.start.offset
	const end_offset = last_node.position?.end.offset

	return start_offset !== undefined && end_offset !== undefined
		? original_text.slice(start_offset, end_offset)
		: nodes.map(node => processor.stringify(node as unknown as Root)).join('\n\n')
}
