'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { medias } from '@website/appdata/app'
import { banner_images } from '@website/appdata/modules'
import LinkButtons from '@website/components/LinkButtons'
import useMounted from '@website/hooks/useMounted'
import { $ } from '@website/utils'
import { base_url_files_website, is_server } from '@website/utils/const'
import { AnimatePresence, motion } from 'framer-motion'
import { generateJSXMeshGradient } from 'meshgrad'
import { useLocale, useTranslations } from 'next-intl'
import { FaDiscord } from 'react-icons/fa'
import { IoLogoWechat } from 'react-icons/io5'
import { TypeAnimation } from 'react-type-animation'

import styles from './index.module.css'

import type { TargetAndTransition } from 'framer-motion'

const Index = () => {
	const t = useTranslations('index')
	const locale = useLocale()
	const mounted = useMounted()
	const [gradient, setGradient] = useState<TargetAndTransition>()
	const [step, setStep] = useState(0)
	const [show_type, setShowType] = useState(true)
	const is_chinese = locale === 'zh'
	const name = banner_images[step]
	const requested_images = useRef(new Set<string>([name]))
	const [loaded_images, setLoadedImages] = useState([name])

	const ensureLoadedImage = (target: string) => {
		setLoadedImages(prev => (prev.includes(target) ? prev : [...prev, target]))
	}

	useEffect(() => {
		if (is_server) return

		ensureLoadedImage(name)

		const next_name = banner_images[(step + 1) % banner_images.length]
		const next_path = `${base_url_files_website}/${next_name}.png`

		if (requested_images.current.has(next_name)) return

		requested_images.current.add(next_name)

		const image = new Image()

		image.decoding = 'async'
		image.src = next_path

		if (typeof image.decode === 'function') {
			image.decode()
				.then(() => ensureLoadedImage(next_name))
				.catch(() => ensureLoadedImage(next_name))
		} else {
			image.onload = () => ensureLoadedImage(next_name)
			image.onerror = () => ensureLoadedImage(next_name)
		}
	}, [name, step])

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
				<div
					className='
						px-4 py-1.5
						mb-8
						rounded-full
						text-sm font-mono
						bg-black/40
						border border-white/10
						opacity-80 backdrop-blur-md
						-mt-9
					'
				>
					npm i polywise -g
				</div>
				<div className='title_wrap flex flex-col items-center'>
					<div className='feature_slot flex justify-center'>
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
					</div>
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
				<div className='community_row flex justify-center'>
					{is_chinese ? (
						<div className='community_wechat' tabIndex={0}>
							<div
								className='
									flex
									items-center
									gap-2
									opacity-60
									hover:opacity-100
									cursor-pointer
								'
							>
								<IoLogoWechat className='community_icon'></IoLogoWechat>
								<span>{t('Banner.community.wechat_label')}</span>
							</div>
							<div className='community_qrcode'>
								<img
									src='/images/wechat%20_group_qrcode.png'
									alt={t('Banner.community.wechat_qrcode_alt')}
								/>
							</div>
						</div>
					) : (
						<a
							className='
								gap-2
								opacity-60
								hover:opacity-100
								community_link clickable
							'
							href={medias.discord}
							target='_blank'
							rel='noreferrer'
						>
							<FaDiscord className='community_icon'></FaDiscord>
							{t('Banner.community.discord_label')}
						</a>
					)}
				</div>
				<div className='image_preview_wrap mt-10 w-full max-md:mt-6'>
					<div className='image_preview relative flex w-full'>
						<img
							className='image image_placeholder box-border'
							src={`${base_url_files_website}/${banner_images[0]}.png`}
							alt=''
							aria-hidden='true'
						/>
						{banner_images
							.filter(item => loaded_images.includes(item))
							.map(item => {
								const active = item === name

								return (
									<motion.img
										className='image image_layer rounded-2xl'
										src={`${base_url_files_website}/${item}.png`}
										alt={`image_preview_${item}`}
										initial={false}
										animate={
											active
												? {
														opacity: 0.6,
														scale: 1,
														visibility: 'visible'
													}
												: {
														opacity: 0,
														scale: 0.99,
														transitionEnd: {
															visibility: 'hidden'
														}
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
