import type { AnchorProps } from 'antd'
import type { BlockContent, DefinitionContent, Heading, Link, ListItem, Paragraph, PhrasingContent, Text } from 'mdast'

const Index = (
	map: Map<string, Heading>,
	children: Array<ListItem | BlockContent | DefinitionContent | PhrasingContent>
) => {
	if (!children) return null

	const target: AnchorProps['items'] = []

	children.map((item, index) => {
		const { type } = item

		switch (type) {
			case 'listItem':
				const p = item.children[0] as Paragraph
				const link = p.children[0] as Link
				const { value } = link.children[0] as Text
				const level = map.get(value) as unknown as number

				const anchor_item = {
					key: `${value}${index}`,
					title: <span data-level={`${level}`}>{value}</span>,
					href: `#${value}`,
					level
				} as Required<AnchorProps>['items'][number]

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
