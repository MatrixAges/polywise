'use client'

import LocaleSelect from '@website/components/LocaleSelect'
import LogoWithBg from '@website/components/LogoWithBg'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { link_groups, media_items } from './links'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('layout')

	return (
		<div className={$.cx('box-border', styles._local)}>
			<div className='limited_content_wrap flex flex-col'>
				<div className='sitemap_wrap flex justify-between'>
					<div className='left_wrap flex flex-col'>
						<LogoWithBg size={36} color='white' fillColor='var(--color_bg)'></LogoWithBg>
						<div className='slogan_wrap flex flex-col'>
							<h1 className='slogan'>{t(`slogan.line_1`)}</h1>
							<h1 className='slogan'>{t(`slogan.line_2`)}</h1>
						</div>
						<div className='media_items flex'>
							{media_items.map(({ link, Icon }, index) => (
								<a
									className='
										flex
										items-center justify-center
										media_item clickable
									'
									href={link}
									target='_blank'
									key={index}
								>
									<Icon size={21} weight='fill'></Icon>
								</a>
							))}
						</div>
					</div>
					<div className='right_wrap flex'>
						{link_groups.map((item, index) => (
							<div className='group_wrap box-border flex flex-col' key={index}>
								<h2>{t(`Footer.${item.title}`)}</h2>
								<div className='link_items flex flex-col'>
									{item.items.map((it, idx) => (
										<Link
											className='link_item'
											href={it.link}
											target={
												it.link.startsWith('https') ? '_blank' : '_self'
											}
											key={idx}
										>
											{t(`title.${it.title}`)}
										</Link>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
				<div className='bottom_line flex items-center justify-between'>
					<span className='copyright'>Copyright © {new Date().getFullYear()} Polywise</span>
					<LocaleSelect></LocaleSelect>
				</div>
			</div>
		</div>
	)
}

export default $.memo(Index)
