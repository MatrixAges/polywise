'use client'

import { useEffect, useMemo, useState } from 'react'
import modules, { banner_images } from '@website/appdata/modules'
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
	const name = modules[step].name
	const image_name = banner_images[step]

	useEffect(() => {
		if (is_server) return

		const paths = banner_images.map(item => `${base_url_files_website}/banner/${item}.png`)

		paths.forEach(path => {
			const image = new Image()

			image.decoding = 'async'
			image.src = path
		})
	}, [])

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

	const module = useMemo(() => t_global(name), [t_global, name])

	const sequence = useMemo(() => {
		const target = [] as Array<any>

		modules.forEach((item, index) => {
			target.push(() => setStep(index), t(`Banner.${item.name}.action`), 2100)
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
								key={module}
							>
								{module}
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
					<AnimatePresence mode='wait'>
						<motion.div
							className='image_preview flex'
							initial={mounted ? { opacity: 0, scale: 0.99 } : { opacity: 0.6, scale: 1 }}
							animate={{ opacity: 0.6, scale: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3, ease: 'easeInOut' }}
							key={image_name}
						>
							<img
								className='image box-border'
								src={`${base_url_files_website}/preview/${name}/${image_name}.png`}
								alt={`image_preview_${image_name}`}
							/>
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
		</div>
	)
}

export default $.memo(Index)
