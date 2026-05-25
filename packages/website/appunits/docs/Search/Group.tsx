import { useMemo, useRef } from 'react'
import { useMemoizedFn } from '@website/hooks/ahooks'
import { $, UpperFirst } from '@website/utils'
import { FileText } from 'lucide-react'
import Link from 'next/link'

import Item from './Item'

import type { IndexItem } from '.'

interface IProps {
	link: string
	items: Array<IndexItem>
	current: { link: string; index: number | null }
	setCurrent: (v: { link: string; index: number | null }) => void
}

const Index = (props: IProps) => {
	const { link, items, current, setCurrent } = props
	const ref = useRef<HTMLAnchorElement>(null)
	const title = useMemo(() => items[0].headings.split('>')[0], [items])

	const active = useMemo(() => {
		const v = current.link === link && current.index === null

		if (v && ref.current) {
			ref.current.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'nearest'
			})
		}

		return v
	}, [current])

	const hoverTitle = useMemoizedFn(() => setCurrent({ link, index: null }))
	const setIndex = useMemoizedFn((v: number) => setCurrent({ link, index: v }))

	return (
		<div
			className='
				box-border
				flex flex-col
				w-full
				group_item
			'
		>
			<Link
				className={$.cx('group_title flex items-center justify-between', active && 'active')}
				href={`/docs/${link}`}
				onMouseOver={hoverTitle}
				ref={ref}
			>
				<div className='flex items-center'>
					<FileText className='icon' size={16}></FileText>
					{title}
				</div>
				<span className='module'>{UpperFirst(link.split('/')[0])}</span>
			</Link>
			<div
				className='
					box-border
					flex flex-col
					w-full
					page_items
				'
			>
				{items.map((item, index) => (
					<Item
						{...item}
						index={index}
						active={current.link === link && current.index === index}
						setIndex={setIndex}
						key={item.id}
					></Item>
				))}
			</div>
		</div>
	)
}

export default $.memo(Index)
