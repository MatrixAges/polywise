'use client'

import { latest_changelogs } from '@website/appdata/changelogs'
import { latest_journals } from '@website/appdata/journals'
import useLocale from '@website/hooks/useLocale'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('index')
	const { locale } = useLocale()

	return (
		<section className={$.cx('section_wrap flex', styles._local)}>
			<div className='limited_content_wrap flex'>
				<div className='latest_item box-border flex flex-col'>
					<div className='header_wrap flex items-center justify-between'>
						<div className='flex flex-col'>
							<h2 className='latest_title'>{t('Latest.journal.title')}</h2>
							<span className='desc'>{t('Latest.journal.desc')}</span>
						</div>
						<img src='/images/svg/sunny.svg' alt='img_journal' />
					</div>
					<div className='items_wrap flex w-full flex-col'>
						{latest_journals.map((item, index) => (
							<Link
								className='item_wrap flex flex-col'
								href={`/journal/${item.id}`}
								key={index}
							>
								<h3 className='item_title'>{item.id}</h3>
								<div className='content_title'>{item.title[locale]}</div>
							</Link>
						))}
						<Link className='item_wrap flex flex-col' href='/journal'>
							<div className='content_title'>{t('Latest.all')} &gt;</div>
						</Link>
					</div>
				</div>
				<div className='latest_item box-border flex flex-col'>
					<div className='header_wrap flex items-center justify-between'>
						<div className='flex flex-col'>
							<h2 className='latest_title'>{t('Latest.changelog.title')}</h2>
							<span className='desc'>{t('Latest.changelog.desc')}</span>
						</div>
						<img src='/images/svg/download-for-offline.svg' alt='img_changelog' />
					</div>
					<div className='items_wrap flex w-full flex-col'>
						{latest_changelogs.map((item, index) => (
							<Link
								className='item_wrap flex flex-col'
								href={`/changelog/${item.id}`}
								key={index}
							>
								<h3 className='item_title'>v{item.id}</h3>
								<div className='content_title'>{item.title[locale]}</div>
							</Link>
						))}
						<Link className='item_wrap flex flex-col' href='/changelog'>
							<div className='content_title'>{t('Latest.all')} &gt;</div>
						</Link>
					</div>
				</div>
			</div>
		</section>
	)
}

export default $.memo(Index)
