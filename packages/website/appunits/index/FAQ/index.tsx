'use client'

import { CaretRightIcon } from '@phosphor-icons/react'
import { $ } from '@website/utils'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('index')
	const items = Array.from({ length: 10 }, (_, index) => index)

	return (
		<section className='limited_content_wrap section_wrap'>
			<div className={$.cx('flex w-full flex-col', styles._local)}>
				<h2 className='section_title'>{t('FAQ.title')}</h2>
				<h3 className='section_desc'>{t('FAQ.subtitle')}</h3>
				<div
					className='
						flex flex-col
						rounded-2xl
						faq_items
					'
				>
					{items.map(index => (
						<details className='faq_item' key={index}>
							<summary className='summary'>
								<span className='question'>
									{index + 1}. {t(`FAQ.items.${index}.q`)}
								</span>
								<CaretRightIcon className='icon' weight='bold'></CaretRightIcon>
							</summary>
							<p className='answer'>{t(`FAQ.items.${index}.a`)}</p>
						</details>
					))}
				</div>
			</div>
		</section>
	)
}

export default $.memo(Index)
