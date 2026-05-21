import type { HelpNode, RenderedHelp } from '../types'

const root_id = 'root'

const resolveNode = (tree: Record<string, HelpNode>, path: Array<string>) => {
	let current = tree[root_id]

	for (const segment of path) {
		const next_id = current.children?.find(
			child_id => tree[child_id]?.title === segment || child_id === segment
		)

		if (!next_id) {
			return null
		}

		current = tree[next_id]
	}

	return current
}

export const renderHelpTree = (tree: Record<string, HelpNode>, path: Array<string> = []): RenderedHelp | null => {
	const node = resolveNode(tree, path)

	if (!node) {
		return null
	}

	return {
		path,
		title: node.title,
		summary: node.summary,
		items: (node.children || [])
			.map(child_id => tree[child_id])
			.filter(Boolean)
			.map(child => ({
				key: child.id,
				title: child.title,
				summary: child.summary,
				kind: child.kind
			})),
		hints: node.hints || [],
		examples: node.examples || []
	}
}

export const root_help_id = root_id
