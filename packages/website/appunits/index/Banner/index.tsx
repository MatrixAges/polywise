'use client'

import { useEffect, useMemo, useState } from 'react'
import { banner_images } from '@website/appdata/modules'
import LinkButtons from '@website/components/LinkButtons'
import useMounted from '@website/hooks/useMounted'
import { $ } from '@website/utils'
import { base_url_files_website, is_server } from '@website/utils/const'
import { AnimatePresence, motion } from 'framer-motion'
import { generateJSXMeshGradient } from 'meshgrad'
import { useTranslations } from 'next-intl'
import { TypeAnimation } from 'react-type-animation'

import styles from './index.module.css'

import type { TargetAndTransition } from 'framer-motion'

const Index = () => {
	const t = useTranslations('index')
	const t_global = useTranslations('global')
	const mounted = useMounted()
	const [gradient, setGradient] = useState<TargetAndTransition>()
	const [step, setStep] = useState(0)
	const [show_type, setShowType] = useState(true)
	const name = banner_images[step]

	useEffect(() => {
		setGradient({ background: generateJSXMeshGradient(6).backgroundImage })
	}, [step])

	useEffect(() => {
		setShowType(false)

		const timer = setTimeout(() => {
			setShowType(true)
		}, 0)

		return () => clearTimeout(timer)
	}, [t])

	const title = useMemo(() => t(`Banner.${name}.title`), [name])

	const sequence = useMemo(() => {
		const target = [] as Array<any>

		banner_images.forEach((item, index) => {
			target.push(() => setStep(index), t(`Banner.${item}.action`), 3600)
		})

		return target
	}, [t])

	return (
		<div className={$.cx('relative flex items-center justify-center', styles._local)}>
			<motion.div className='gradient absolute' animate={gradient} transition={{ duration: 1.2 }} />
			<div className='gradient_mask absolute w-screen'></div>
			<div
				className='
					relative
					box-border
					flex flex-col
					items-center justify-center
					w-full
					limited_content_wrap
				'
			>
				<div className='title_wrap flex flex-col items-center'>
					{show_type && (
						<TypeAnimation
							className='feature'
							preRenderFirstString
							wrapper='h1'
							speed={{ type: 'keyStrokeDelayInMs', value: 90 }}
							deletionSpeed={72}
							cursor={true}
							repeat={Infinity}
							sequence={sequence}
						/>
					)}
					<h1 className='with'>
						<span>{t('Banner.with')}</span>
						<AnimatePresence mode='wait'>
							<motion.span
								className='module'
								initial={mounted ? { opacity: 0, y: -12 } : { opacity: 1, y: 0 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 6 }}
								transition={{ duration: 0.6 }}
								key={title}
							>
								{title}
							</motion.span>
						</AnimatePresence>
					</h1>
				</div>
				<div className='desc_wrap flex flex-col items-center'>
					<h2 className='desc'>{t('Banner.desc.line_1')}</h2>
					<h2 className='desc'>{t('Banner.desc.line_2')}</h2>
				</div>
				<LinkButtons></LinkButtons>
				<div className='image_preview_wrap mt-16 w-full'>
					<div className='image_preview relative flex w-full'>
						<img
							className='image image_placeholder box-border'
							src={`${base_url_files_website}/banner/${banner_images[0]}.png`}
							alt=''
							aria-hidden='true'
						/>
						{banner_images.map(item => {
							const active = item === name

							return (
								<motion.img
									className='image image_layer box-border'
									src={`${base_url_files_website}/banner/${item}.png`}
									alt={`image_preview_${item}`}
									initial={false}
									animate={
										active
											? { opacity: 0.6, scale: 1, visibility: 'visible' }
											: {
													opacity: 0,
													scale: 0.99,
													transitionEnd: { visibility: 'hidden' }
												}
									}
									transition={{ duration: 0.6, ease: 'easeInOut' }}
									key={item}
								/>
							)
						})}
					</div>
				</div>
			</div>
		</div>
	)
}

export default $.memo(Index)
