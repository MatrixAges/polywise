'use client'

import { useEffect, useMemo, useState } from 'react'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import TocIcon from './Icon'

import styles from './index.module.css'

import type { TocItem } from '@website/types'

interface IProps {
	list: TocItem[]
	className?: string
	as_content?: boolean
}

const flatten = (items: TocItem[]): string[] => {
	return items.flatMap(item => [item.href, ...(item.children ? flatten(item.children) : [])])
}

const renderItems = (items: TocItem[], active_href: string) => {
	return (
		<ul className='toc_list flex flex-col'>
			{items.map(item => (
				<li className='toc_item' key={item.key}>
					<a
						className={$.cx(
							`
							relative
							flex
							items-center
							h-5
							mb-3
							transition-colors duration-200
							toc_link
						`,
							active_href === item.href && 'active'
						)}
						href={item.href}
						style={{ paddingLeft: `${Math.max(item.level - 1, 0) * 12}px` }}
					>
						{item.title}
					</a>
					{item.children && item.children.length > 0 && renderItems(item.children, active_href)}
				</li>
			))}
		</ul>
	)
}

const Index = (props: IProps) => {
	const { list, className, as_content } = props
	const t = useTranslations('doc')
	const hrefs = useMemo(() => flatten(list), [list])
	const [active_href, setActiveHref] = useState(hrefs[0] ?? '')

	useEffect(() => {
		if (!hrefs.length) return

		const syncFromHash = () => {
			const hash = window.location.hash

			if (hash && hrefs.includes(hash)) {
				setActiveHref(hash)
			}
		}

		syncFromHash()
		window.addEventListener('hashchange', syncFromHash)

		const observer = new IntersectionObserver(
			entries => {
				const visible = entries
					.filter(entry => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

				if (!visible?.target.id) return

				setActiveHref(`#${visible.target.id}`)
			},
			{ rootMargin: '-18% 0px -62% 0px', threshold: [0, 1] }
		)

		hrefs.forEach(href => {
			const id = href.replace('#', '')
			const element = document.getElementById(id)

			if (element) observer.observe(element)
		})

		return () => {
			window.removeEventListener('hashchange', syncFromHash)
			observer.disconnect()
		}
	}, [hrefs])

	return (
		<div className={$.cx('box-border h-full', styles._local, as_content && styles.as_content, className)}>
			<div className='flex flex-col'>
				{!as_content && (
					<div className='header_wrap sticky flex items-center'>
						<TocIcon aria-hidden />
						<span className='title font-medium'>{t('toc.title')}</span>
					</div>
				)}
				<nav className='border-l-2 border-black/6'>{renderItems(list, active_href)}</nav>
			</div>
		</div>
	)
}

export default $.memo(Index)
