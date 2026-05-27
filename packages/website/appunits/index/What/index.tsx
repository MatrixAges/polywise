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
				<div
					className='
						grid grid-cols-2
						border-l border-t
						items_wrap max-md:grid-cols-1
					'
				>
					{items.map(index => (
						<div
							className='
								flex flex-col
								gap-4
								p-12
								border-b border-r
								item
							'
							key={index}
						>
							<span className='title text-2xl font-semibold max-md:text-xl'>
								{t(`What.items.${index}.title`)}
							</span>
							<span className='desc'>{t(`What.items.${index}.desc`)}</span>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

export default $.memo(Index)
