'use client'

import { ArrowUpRight } from '@phosphor-icons/react'
import MDContentPage from '@website/components/MDContentPage'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'

import Item from './Item'

import styles from './index.module.css'

interface IProps {
	changelogs: Array<{
		id: string
		date: string
	}>
	mds: Array<string>
}

const Index = (props: IProps) => {
	const { changelogs, mds } = props

	return (
		<div className={$.cx('box-border flex w-full flex-col', styles._local)}>
			{changelogs.map((item, index) => (
				<Item item={item} md={mds[index]} key={item.id}></Item>
			))}
		</div>
	)
}

export default $.memo(Index)
