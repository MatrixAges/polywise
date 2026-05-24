'use client'

import { ArrowUpRight } from '@phosphor-icons/react'
import MDContentPage from '@website/components/MDContentPage'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'

interface IProps {
	item: { id: string; date: string }
	md: string
}

const Index = (props: IProps) => {
	const { item, md } = props

	const Left = (
		<Link
			className='
				sticky
				box-border
				flex flex-col
				left_wrap
			'
			href={`/changelog/${item.id}`}
		>
			<div className='version_wrap flex items-center'>
				<span className='version'>v{item.id}</span>
				<ArrowUpRight className='icon ml-0.5' weight='bold'></ArrowUpRight>
			</div>
			<span className='date'>{item.date}</span>
		</Link>
	)

	return (
		<div className='changelog_wrap flex'>
			{Left}
			<div
				className='
					relative
					box-border
					flex
					w-full
					md_wrap
				'
			>
				<Link
					className='
						absolute
						top-0 right-0
						flex
						items-center justify-center
						badge_link
					'
					href={`/changelog/${item.id}`}
				>
					<ArrowUpRight className='icon absolute' weight='bold'></ArrowUpRight>
				</Link>
				<MDContentPage md={md} simple with_bg></MDContentPage>
			</div>
		</div>
	)
}

export default $.memo(Index)
