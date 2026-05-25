'use client'

import { GithubLogoIcon } from '@phosphor-icons/react'
import { github_release_link, medias } from '@website/appdata/app'
import Logo from '@website/components/Logo'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('download')
	const t_global = useTranslations('global')

	return (
		<div className={$.cx('small_content_wrap', styles._local)}>
			<div className='header_wrap flex flex-col items-center'>
				<div
					className='
						relative
						flex
						items-center justify-center
						logo_wrap
					'
				>
					<Logo className='logo' size={72} color='var(--color_text)' />
				</div>
				<h1 className='title'>{t('title')}</h1>
				<span className='desc'>{t('desc')}</span>

				<a href={github_release_link} target='_blank'>
					<button
						className='
							flex
							items-center justify-center
							btn_download btn_light
						'
					>
						{t('btn_download', { platform: 'GitHub Releases' })}
					</button>
				</a>
				<span className='version'>{t('latest')}: mock build</span>
			</div>
			<div className='download_items flex flex-col'>
				<div className='download_item flex items-center justify-between'>
					<div className='flex items-center'>
						<GithubLogoIcon weight='fill' size={16} />
						<span className='name'>{t('github_release')}</span>
					</div>
					<a href={github_release_link} target='_blank'>
						<button className='btn_download btn_light'>{t_global('visit')}</button>
					</a>
				</div>
				<div className='download_item flex items-center justify-between'>
					<div className='flex items-center'>
						<GithubLogoIcon weight='fill' size={16} />
						<span className='name'>Source repository</span>
					</div>
					<a href={medias.github} target='_blank'>
						<button className='btn_download btn_light'>{t_global('visit')}</button>
					</a>
				</div>
			</div>
		</div>
	)
}

export default Index
