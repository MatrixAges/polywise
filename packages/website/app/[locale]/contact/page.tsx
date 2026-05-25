'use client'

import { ChatDots, Files, Microphone, RedditLogo, Users, YoutubeLogo } from '@phosphor-icons/react'
import { mails, medias } from '@website/appdata/app'
import useLocale from '@website/hooks/useLocale'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('contact')
	const t_global = useTranslations('global')
	const { locale } = useLocale()

	return (
		<div className={$.cx('limited_content_wrap', styles._local)}>
			<div className='header_wrap flex flex-col items-center'>
				<h1 className='section_title'>{t('title')}</h1>
				<span className='section_desc'>{t('desc')}</span>
			</div>
			<div className='contact_items support flex'>
				<div
					className='
						flex flex-col
						contact_item lightcard top
					'
				>
					<div className='flex items-center'>
						<ChatDots weight='fill'></ChatDots>
						<h2>{t('supports.user.title')}</h2>
					</div>
					<span className='desc'>{t('supports.user.desc')}</span>
					<a className='btn_link btn_light' href={mails.support} target='_blank'>
						{t('supports.mailto')} &gt;
					</a>
				</div>
				<div
					className='
						flex flex-col
						contact_item lightcard top
					'
				>
					<div className='flex items-center'>
						<Users weight='fill'></Users>
						<h2>{t('supports.team.title')}</h2>
					</div>
					<span className='desc'>{t('supports.team.desc')}</span>
					<a className='btn_link btn_light' href={mails.enterprise} target='_blank'>
						{t('supports.mailto')} &gt;
					</a>
				</div>
			</div>
			<div className='contact_items flex'>
				<div className='contact_item flex flex-col'>
					<div className='flex items-center'>
						<RedditLogo weight='fill'></RedditLogo>
						<h2>{t('references.reddit.title')}</h2>
					</div>
					<span className='desc'>{t('references.reddit.desc')}</span>
					<a className='btn_link' href={medias.reddit} target='_blank'>
						{t_global('visit')} &gt;
					</a>
				</div>
				<div className='contact_item flex flex-col'>
					<div className='flex items-center'>
						<Files weight='fill'></Files>
						<h2>{t('references.docs.title')}</h2>
					</div>
					<span className='desc'>{t('references.docs.desc')}</span>
					<Link className='btn_link' href='/docs' target='_blank'>
						{t_global('visit')} &gt;
					</Link>
				</div>
			</div>
		</div>
	)
}

export default Index
