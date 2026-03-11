import processor from './processor'

import type { Root, RootContent } from 'mdast'

export default (nodes: Array<RootContent>, original_text: string) => {
	if (nodes.length === 0) return ''

	let result = ''
	let last_end_offset = -1

	for (const node of nodes) {
		const start_offset = node.position?.start.offset
		const end_offset = node.position?.end.offset

		if (start_offset !== undefined && end_offset !== undefined) {
			if (last_end_offset !== -1) {
				const between = original_text.slice(last_end_offset, start_offset)

				if (between.trim() === '') {
					result += between
				} else {
					result += '\n\n'
				}
			} else if (result.length > 0) {
				result += '\n\n'
			}

			result += original_text.slice(start_offset, end_offset)
			last_end_offset = end_offset
		} else {
			if (result.length > 0) result += '\n\n'

			result += processor.stringify(node as unknown as Root).trimEnd()
			last_end_offset = -1
		}
	}

	return result
}
