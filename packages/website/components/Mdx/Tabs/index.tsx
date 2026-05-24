import { Tabs } from '@base-ui/react/tabs'
import { $ } from '@website/utils'
import getMDXContent from '@website/utils/getMDXContent'

import styles from './index.module.css'

interface TabsItem {
	key: string
	label: string
	children: string
}

interface IProps {
	defaultActiveKey?: string
	items?: TabsItem[]
}

const Index = (props: IProps) => {
	const { items, ...rest_props } = props

	const target_items = (items ?? []).map(item => {
		const MDXContent = getMDXContent(item.children as string)

		return {
			...item,
			content: <MDXContent></MDXContent>
		}
	})

	return (
		<Tabs.Root className={styles._local} defaultValue={rest_props.defaultActiveKey ?? target_items[0]?.key}>
			<Tabs.List className='tabs_nav flex flex-wrap gap-2'>
				{target_items.map(item => (
					<Tabs.Tab className='tabs_tab' key={item.key} value={item.key}>
						{item.label}
					</Tabs.Tab>
				))}
			</Tabs.List>
			{target_items.map(item => (
				<Tabs.Panel className='tabs_panel' key={item.key} keepMounted value={item.key}>
					{item.content}
				</Tabs.Panel>
			))}
		</Tabs.Root>
	)
}

export default $.memo(Index)
