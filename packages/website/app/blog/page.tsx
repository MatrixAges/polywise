'use client'

import { heading_blogs } from '@website/appdata/blogs'
import useLocale from '@website/hooks/useLocale'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('blog')
	const { locale } = useLocale()
	const getTitle = (title: { zh: string; en: string; ja?: string }) => title[locale] ?? title.en

	return (
		<div className={$.cx('limited_content_wrap flex flex-col', styles._local)}>
			<div className='header_wrap flex items-center justify-between'>
				<div className='flex flex-col'>
					<h1 className='section_title'>{t('title')}</h1>
					<span className='section_desc'>{t('desc')}</span>
				</div>
				<img src='/images/svg/vpn-key.svg' alt='icon_blog' />
			</div>
			<div className='heading_blogs flex flex-wrap'>
				{heading_blogs.map(item => (
					<Link
						className='
							box-border
							heading_blog_item lightcard top clickable
						'
						href={`/blog/${item.id}?title=${getTitle(item.title)}`}
						key={item.id}
					>
						<div
							className='
								flex
								items-center justify-center
								w-full
								img_wrap
							'
						>
							<img src={`/images/svg/${item.id}.svg`} alt={item.id} />
						</div>
						<div
							className='
								box-border
								flex flex-col
								w-full
								text_wrap
							'
						>
							<span className='date'>{item.date}</span>
							<h2>{getTitle(item.title)}</h2>
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}

export default Index
