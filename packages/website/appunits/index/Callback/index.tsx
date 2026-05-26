'use client'

import LinkButtons from '@website/components/LinkButtons'
import Logo from '@website/components/Logo'
import useGradient from '@website/hooks/useGradient'
import { $ } from '@website/utils'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('index')
	const { gradient } = useGradient(1800)

	return (
		<section className={$.cx('section_wrap flex', styles._local)}>
			<div className='limited_content_wrap flex flex-col items-center'>
				<motion.div
					className='
						relative
						flex
						items-center justify-center
						logo_wrap lightcard
					'
					animate={gradient}
					transition={{ duration: 1.2 }}
				>
					<div
						className='
							absolute
							top-0
							left-0
							w-full h-full
							mask
						'
					></div>
					<Logo className='logo' size={54} color='var(--color_text)'></Logo>
				</motion.div>
				<h2 className='subtitle flex flex-col'>
					<span className='line section_title'>{t('Callback.line_1')}</span>
					<span className='line section_title'>{t('Callback.line_2')}</span>
				</h2>
				<LinkButtons></LinkButtons>
			</div>
		</section>
	)
}

export default $.memo(Index)
