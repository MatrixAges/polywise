'use client'

import { $, getArray } from '@website/utils'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

import type { Variants } from 'framer-motion'

const array = getArray(3)

const img_map = {
	0: 'encrypted',
	1: 'stacked-bar-chart',
	2: 'cards'
} as any

const variants_parent: Variants = {
	show: {
		transition: {
			type: 'spring',
			delayChildren: 0.36,
			staggerChildren: 0.18
		}
	},
	hidden: {
		transition: {
			type: 'spring',
			duration: 0.3
		}
	}
}

const variants_item: Variants = {
	show: {
		opacity: 1,
		y: 0,
		transition: { type: 'spring', stiffness: 150, damping: 9 }
	},
	hidden: {
		opacity: 0,
		y: 60,
		transition: { duration: 0.3 }
	}
}

const Index = () => {
	const t = useTranslations('index')

	return (
		<section className='limited_content_wrap section_wrap'>
			<div
				className={$.cx(
					`
					relative
					flex flex-col
					items-center
					w-full
				`,
					styles._local
				)}
			>
				<h2 className='section_title'>{t('Painpoint.title')}</h2>
				<h3 className='section_desc'>{t('Painpoint.subtitle')}</h3>
				<motion.div
					className='painpoint_items box-border flex w-full'
					initial='hidden'
					whileInView='show'
					viewport={{ once: true }}
					variants={variants_parent}
				>
					{array.map((_, index) => (
						<motion.div
							className='
								box-border
								flex flex-col
								painpoint_item lightcard
							'
							variants={variants_item}
							key={index}
						>
							<img
								className='painpoint_image absolute'
								src={`/svgs/${img_map[index]}.svg`}
								alt='painpoint_image'
							/>
							<h2 className='pain_title'>{t(`Painpoint.items.${index}.title`)}</h2>
							<span className='pain'>{t(`Painpoint.items.${index}.pain`)}</span>
							<div className='solution flex flex-col'>
								{t(`Painpoint.items.${index}.solution`)
									.split('\n')
									.map((it, idx) => (
										<span className='line' key={idx}>
											{it}
										</span>
									))}
							</div>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	)
}

export default $.memo(Index)
