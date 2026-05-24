import { $ } from '@website/utils'
import getMDXContent from '@website/utils/getMDXContent'
import { Tabs } from 'antd'

import styles from './index.module.css'

import type { TabsProps } from 'antd'

const Index = (props: TabsProps) => {
	const { items, ...rest_props } = props

	const target_items = items!.map(item => {
		const MDXContent = getMDXContent(item.children as string)

		item.children = <MDXContent></MDXContent>

		return item
	})

	return <Tabs className={styles._local} {...rest_props} items={target_items}></Tabs>
}

export default $.memo(Index)
