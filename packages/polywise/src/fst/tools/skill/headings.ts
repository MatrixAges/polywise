import { remark } from 'remark'

import type { Heading, Root } from 'mdast'

export default (content: string): string => {
	const ast = remark().parse(content) as Root
	const headings: Array<string> = []

	const walk = (node: unknown) => {
		const n = node as Record<string, unknown>

		if (n.type === 'heading') {
			const heading = n as unknown as Heading

			const text = heading.children
				.filter((c): c is { type: 'text'; value: string } => c.type === 'text')
				.map(c => c.value)
				.join(' ')

			if (text) headings.push(text)
		}

		if (Array.isArray(n.children)) {
			for (const child of n.children) walk(child)
		}
	}

	walk(ast)

	return headings.join(' | ')
}
