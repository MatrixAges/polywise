'use client'

import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('index')
	const items = Array.from({ length: 6 }, (_, index) => index)

	return (
		<section className='limited_content_wrap section_wrap'>
			<div className={$.cx('relative flex w-full flex-col', styles._local)}>
				<h2 className='section_title'>{t('What.title')}</h2>
				<h3 className='section_desc'>{t('What.subtitle')}</h3>
				<div className='hero lightcard'>
					<h4 className='headline'>{t('What.headline')}</h4>
					<p className='lead'>{t('What.lead')}</p>
				</div>
				<div className='items'>
					{items.map(index => (
						<div className='item lightcard' key={index}>
							<span className='mark'>[*]</span>
							<div className='copy'>
								<h5 className='item_title'>{t(`What.items.${index}.title`)}</h5>
								<p className='item_desc'>{t(`What.items.${index}.desc`)}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

export default $.memo(Index)
