import getMdastText from './getMdastText'

import type { TocItem } from '@website/types'
import type { BlockContent, DefinitionContent, Link, ListItem, Paragraph, PhrasingContent } from 'mdast'

const renderPhrasingContent = (children: PhrasingContent[], key_prefix = 'toc-title') =>
	children.map((child, index) => {
		const key = `${key_prefix}-${index}`

		switch (child.type) {
			case 'text':
				return child.value
			case 'inlineCode':
				return <code key={key}>{child.value}</code>
			case 'emphasis':
				return <em key={key}>{renderPhrasingContent(child.children, key)}</em>
			case 'strong':
				return <strong key={key}>{renderPhrasingContent(child.children, key)}</strong>
			case 'delete':
				return <del key={key}>{renderPhrasingContent(child.children, key)}</del>
			case 'link':
				return <span key={key}>{renderPhrasingContent(child.children, key)}</span>
			default:
				if ('children' in child && Array.isArray(child.children)) {
					return (
						<span key={key}>
							{renderPhrasingContent(child.children as PhrasingContent[], key)}
						</span>
					)
				}

				return null
		}
	})

const Index = (
	map: Map<string, number>,
	children: Array<ListItem | BlockContent | DefinitionContent | PhrasingContent>
) => {
	if (!children) return null

	const target: TocItem[] = []

	children.map((item, index) => {
		const { type } = item

		switch (type) {
			case 'listItem':
				const p = item.children[0] as Paragraph
				const link = p.children[0] as Link
				const value = getMdastText(link.children)
				const level = map.get(value) ?? 1

				const anchor_item: TocItem = {
					key: `${value}${index}`,
					title: <span data-level={`${level}`}>{renderPhrasingContent(link.children)}</span>,
					href: `#${value}`,
					level
				}

				if (item.children.length > 0) {
					anchor_item['children'] = Index(map, item.children)!
				}

				target.push(anchor_item)

				break
			case 'list':
				target.push(...Index(map, item.children)!)
				break
		}
	})

	return target
}

export default Index
