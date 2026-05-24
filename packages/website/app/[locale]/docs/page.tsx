'use client'

import { basics, popular } from '@website/appdata/docs'
import Logo from '@website/components/Logo'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './page.module.css'

const Index = () => {
	const t = useTranslations('docs')

	return (
		<div className={$.cx('box-border w-full', styles._local)}>
			<div className='header_wrap flex flex-col'>
				<div className='perspective_wrap relative'>
					<Logo className='logo absolute' size={21} color='rgba(255,255,255,0.81)'></Logo>
					<div className='layer top absolute'></div>
					<div className='layer middle absolute'></div>
					<div className='layer bottom absolute'></div>
				</div>
				<h1>{t('page.title')}</h1>
				<span className='desc'>{t('page.desc')}</span>
			</div>
			<div className='popular flex flex-col'>
				<h2>{t('page.popular.title')}</h2>
				<div className='popular_items'>
					{popular.map((item, index) => (
						<Link
							className='popular_item clickable flex flex-col'
							href={`/docs/${item.link}`}
							key={index}
						>
							<div className='top_wrap flex items-center justify-center'>
								<div className='icon_wrap flex items-center justify-center'>
									{item.icon}
								</div>
							</div>
							<div className='bottom_wrap flex flex-col'>
								<h3>{t(`page.popular.${index}.title`)}</h3>
								<span className='desc'>{t(`page.popular.${index}.desc`)}</span>
							</div>
						</Link>
					))}
				</div>
			</div>
			<div className='basics flex flex-col'>
				<h2>{t('page.basics.title')}</h2>
				<span className='subtitle'>{t('page.basics.desc')}</span>
				<div className='basic_items flex flex-wrap'>
					{basics.map((item, index) => (
						<Link
							className='basic_item clickable box-border flex'
							href={`/docs/${item.link}`}
							key={index}
						>
							<div className='icon_wrap flex'>{item.icon}</div>
							<div className='body_wrap flex flex-col'>
								<h3>{t(`page.basics.${index}.title`)}</h3>
								<span className='desc'>{t(`page.basics.${index}.desc`)}</span>
							</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	)
}

export default Index
