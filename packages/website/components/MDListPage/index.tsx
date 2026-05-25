'use client'

import { ReactNode, useMemo, useState } from 'react'
import { LinkIcon } from '@phosphor-icons/react'
import useLocale from '@website/hooks/useLocale'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'

import styles from './index.module.css'

interface IProps {
	type: string
	title: string
	desc: string
	group: Array<
		Array<{
			id: string
			title: {
				zh: string
				en: string
			}
			date?: string
		}>
	>
	Icon?: ReactNode
	timeline?: boolean
	date?: boolean
	id_prefix?: string
}

const Index = (props: IProps) => {
	const { type, title, desc, group, Icon, timeline, date, id_prefix } = props

	const [page] = useState(0)
	const { locale } = useLocale()
	const getTitle = (title: { zh: string; en: string }) => (locale === 'zh' ? title.zh : title.en)

	const items = useMemo(() => group[page], [page])

	return (
		<section
			className={$.cx(
				'small_content_wrap section_wrap',
				styles._local,
				Icon !== undefined && styles.has_icon,
				timeline && styles.timeline,
				date && styles.date
			)}
		>
			<div className='header_wrap flex flex-col items-center'>
				<div className='icon_wrap'>{Icon}</div>
				<div className='flex flex-col'>
					<h1 className='section_title'>{title}</h1>
					<span className='section_desc'>{desc}</span>
				</div>
			</div>
			<div className='items flex flex-col'>
				{items.map((item, index) => (
					<Link
						className='item flex items-center'
						href={`/${type}/${item.id}?title=${getTitle(item.title)}`}
						key={index}
					>
						<span className='id box-border'>
							{id_prefix}
							{item.id}
						</span>
						<h3 className='title'>{getTitle(item.title)}</h3>
						<div className='right_wrap'>
							{item.date ?? <LinkIcon className='icon'></LinkIcon>}
						</div>
					</Link>
				))}
			</div>
		</section>
	)
}

export default $.memo(Index)
