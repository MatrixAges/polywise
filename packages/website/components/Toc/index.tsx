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
							my-1.5
							truncate
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

		const headingElements = hrefs
			.map(href => {
				const id = href.replace('#', '')
				const element = document.getElementById(id)

				return element ? { href, element } : null
			})
			.filter(Boolean) as { href: string; element: HTMLElement }[]

		const syncFromHash = () => {
			const hash = window.location.hash

			if (hash && hrefs.includes(hash)) {
				setActiveHref(hash)
			}
		}

		const syncFromScroll = () => {
			if (!headingElements.length) return

			const viewportHeight = window.innerHeight
			const scrollBottom = window.scrollY + viewportHeight
			const documentHeight = document.documentElement.scrollHeight
			const remainingDistance = Math.max(documentHeight - scrollBottom, 0)
			const topActivationLine = Math.min(Math.max(viewportHeight * 0.18, 72), 140)
			const bottomActivationLine = viewportHeight * 0.8
			const transitionDistance = viewportHeight * 0.75
			const transitionProgress =
				transitionDistance <= 0
					? 1
					: Math.min(Math.max(1 - remainingDistance / transitionDistance, 0), 1)
			const activationLine =
				topActivationLine + (bottomActivationLine - topActivationLine) * transitionProgress
			let nextActiveHref = headingElements[0].href

			for (const { href, element } of headingElements) {
				if (element.getBoundingClientRect().top <= activationLine) {
					nextActiveHref = href
					continue
				}

				break
			}

			setActiveHref(prev => (prev === nextActiveHref ? prev : nextActiveHref))
		}

		let rafId = 0
		const scheduleSyncFromScroll = () => {
			if (rafId) return

			rafId = window.requestAnimationFrame(() => {
				rafId = 0
				syncFromScroll()
			})
		}

		syncFromHash()
		syncFromScroll()
		window.addEventListener('hashchange', syncFromHash)
		window.addEventListener('scroll', scheduleSyncFromScroll, { passive: true })
		window.addEventListener('resize', scheduleSyncFromScroll)

		return () => {
			window.removeEventListener('hashchange', syncFromHash)
			window.removeEventListener('scroll', scheduleSyncFromScroll)
			window.removeEventListener('resize', scheduleSyncFromScroll)

			if (rafId) {
				window.cancelAnimationFrame(rafId)
			}
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
