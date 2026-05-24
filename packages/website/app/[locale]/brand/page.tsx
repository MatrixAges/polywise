'use client'

import { useMemoizedFn } from '@website/hooks/ahooks'
import useGradient from '@website/hooks/useGradient'
import useToast from '@website/hooks/useToast'
import { $ } from '@website/utils'
import { downloadFileBySrc } from '@website/utils/file'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('brand')
	const t_global = useTranslations('global')
	const { gradient } = useGradient()
	const toast = useToast()

	const onDownloadAssert = useMemoizedFn(() => downloadFileBySrc('brand.zip'))

	const onAssert = useMemoizedFn(async e => {
		const el = e.target as HTMLDivElement
		const src = el.getAttribute('data-src')
		const color = el.getAttribute('data-color')

		if (!src && !color) return

		if (src) return downloadFileBySrc(src)

		if (color) {
			await window.navigator.clipboard.writeText(color)

			toast.success(t_global('copy', { name: color }))
		}
	})

	return (
		<div className={$.cx('small_content_wrap', styles._local)}>
			<section className='header_wrap flex flex-col items-center'>
				<motion.span className='toptext' animate={gradient} transition={{ duration: 1.2 }}>
					{t('header.toptext')}
				</motion.span>
				<h1 className='title section_title'>{t('header.title')}</h1>
				<span className='desc section_desc'>{t('header.desc')}</span>
				<button className='btn_download btn_light' onClick={onDownloadAssert}>
					{t('header.btn_download')}
				</button>
			</section>
			<div className='lightline'></div>
			<section className='section flex flex-col'>
				<h2>{t('naming.title')}</h2>
				<span className='line'>{t('naming.line_1')}</span>
				<span className='line'>{t('naming.line_2')}</span>
			</section>
			<section className='section flex flex-col'>
				<h2>{t('usage.title')}</h2>
				<span className='line'>{t('usage.line_1')}</span>
				<span className='line'>{t('usage.line_2')}</span>
			</section>
			<div className='assets_wrap flex flex-col' onClick={onAssert}>
				<section className='section flex flex-col'>
					<h2>{t('logo.title')}</h2>
					<span className='line'>{t('logo.desc')}</span>
					<div className='items_wrap logos_wrap flex'>
						<div
							className='item_wrap flex items-center justify-center'
							data-src='pure_white.svg'
						>
							<img src='/pure_white.svg' alt='pure_white' />
						</div>
						<div className='item_wrap flex items-center justify-center' data-src='pure.svg'>
							<img src='/pure.svg' alt='pure' />
						</div>
						<div
							className='item_wrap flex items-center justify-center'
							data-src='pure_white.svg'
						>
							<img src='/pure_white.svg' alt='pure_white' />
						</div>
						<div
							className='item_wrap flex items-center justify-center'
							data-src='pure_black.svg'
						>
							<img src='/pure_black.svg' alt='pure_black' />
						</div>
					</div>
				</section>
				<section className='section flex flex-col'>
					<h2>{t('icon.title')}</h2>
					<span className='line'>{t('icon.desc')}</span>
					<div className='items_wrap icons_wrap flex'>
						<div
							className='item_wrap flex items-center justify-center'
							data-src='icon_white_red.svg'
						>
							<img src='/icon_white_red.svg' alt='icon_white' />
						</div>
						<div className='item_wrap flex items-center justify-center' data-src='icon.svg'>
							<img src='/icon.svg' alt='icon' />
						</div>
						<div
							className='item_wrap flex items-center justify-center'
							data-src='icon_white.svg'
						>
							<img src='/icon_white.svg' alt='icon_white' />
						</div>
						<div
							className='item_wrap flex items-center justify-center'
							data-src='icon_black.svg'
						>
							<img src='/icon_black.svg' alt='icon_black' />
						</div>
					</div>
				</section>
				<section className='section flex flex-col'>
					<h2>{t('colors.title')}</h2>
					<span className='line'>{t('colors.desc')}</span>
					<div className='items_wrap colors_wrap flex'>
						<div
							className='item_wrap flex items-center justify-center'
							style={{ background: '#ff0000' }}
							data-color='#ff0000'
						>
							#ff0000
						</div>
						<div
							className='item_wrap flex items-center justify-center'
							style={{ background: '#f7f8f8', color: 'var(--color_bg)' }}
							data-color='#f7f8f8'
						>
							#f7f8f8
						</div>
						<div
							className='
								box-border
								flex
								items-center justify-center
								item_wrap lightcard top
							'
							style={{ background: '#080a0a', border: 'var(--border_light)' }}
							data-color='#080a0a'
						>
							#080a0a
						</div>
						<div
							className='item_wrap flex items-center justify-center'
							style={{ background: '#23252a' }}
							data-color='#23252a'
						>
							#23252a
						</div>
					</div>
				</section>
				<section className='section flex flex-col'>
					<h2>{t('font.title')}</h2>
					<span className='line'>{t('font.desc')}</span>
					<div
						className='
							flex
							items-center justify-center
							items_wrap font_wrap
						'
						data-src='IBMPlexSans.zip'
					>
						{t('font.text')}
					</div>
				</section>
			</div>
		</div>
	)
}

export default $.memo(Index)
