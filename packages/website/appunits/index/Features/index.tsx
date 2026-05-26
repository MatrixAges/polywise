'use client'

import { useEffect, useRef, useState } from 'react'
import {
	ArticleIcon,
	CaretLeftIcon,
	CaretRightIcon,
	ChatsCircleIcon,
	FolderNotchOpenIcon,
	UsersThreeIcon
} from '@phosphor-icons/react'
import { features_images } from '@website/appdata/modules'
import { useDeepCompareEffect, useMemoizedFn } from '@website/hooks/ahooks'
import { $ } from '@website/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { generateJSXMeshGradient } from 'meshgrad'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import styles from './index.module.css'

import type { TargetAndTransition } from 'framer-motion'

const feature_cycle_ms = 3600
const feature_items = [
	{
		Icon: <ArticleIcon></ArticleIcon>,
		key: 'post'
	},
	{
		Icon: <UsersThreeIcon></UsersThreeIcon>,
		key: 'group'
	},
	{
		Icon: <FolderNotchOpenIcon></FolderNotchOpenIcon>,
		key: 'project'
	},
	{
		Icon: <ChatsCircleIcon></ChatsCircleIcon>,
		key: 'im'
	}
] as const

const Index = () => {
	const t = useTranslations('index')
	const [number, setNumber] = useState(0)
	const [gradient, setGradient] = useState<TargetAndTransition>()
	const timer = useRef<ReturnType<typeof setInterval> | null>(null)
	const max = features_images.length - 1
	const image_name = features_images[number]

	useDeepCompareEffect(() => setGradient({ background: generateJSXMeshGradient(6).backgroundImage }), [number])

	const tick = useMemoizedFn(() => {
		timer.current && clearInterval(timer.current)

		timer.current = setInterval(() => {
			setNumber(value => (value >= max ? 0 : value + 1))
		}, feature_cycle_ms)
	})

	useEffect(() => {
		tick()

		return () => {
			if (timer.current) clearInterval(timer.current)
		}
	}, [])

	const prev = useMemoizedFn(() => {
		setNumber(value => (value === 0 ? max : value - 1))

		tick()
	})

	const next = useMemoizedFn(() => {
		setNumber(value => (value >= max ? 0 : value + 1))

		tick()
	})

	return (
		<div className={$.cx('relative flex items-center justify-center', styles._local)}>
			<section className='limited_content_wrap section_wrap'>
				<div className='flex w-full flex-col'>
					<div className='section_header flex items-center justify-between'>
						<div className='flex flex-col'>
							<h2 className='section_title'>{t('Features.title')}</h2>
							<h3 className='section_desc'>{t('Features.subtitle')}</h3>
						</div>
						<div className='toggle_wrap flex'>
							<button
								className='
									flex
									items-center justify-center
									btn_toggle clickable
								'
								onClick={prev}
							>
								<CaretLeftIcon></CaretLeftIcon>
							</button>
							<button
								className='
									flex
									items-center justify-center
									btn_toggle clickable
								'
								// @ts-ignore
								onClick={next}
							>
								<CaretRightIcon></CaretRightIcon>
							</button>
						</div>
					</div>
					<div
						className='
							relative
							box-border
							flex
							items-center justify-center
							w-full
							feature_wrap lightcard
						'
					>
						<motion.div
							className='gradient absolute'
							animate={gradient}
							transition={{ duration: 1.2 }}
						></motion.div>
						<div
							className='
								absolute
								top-0
								left-0
								w-full h-full
								gradient_mask
							'
						></div>
						<div
							className='
								absolute
								top-0
								left-0
								box-border
								flex flex-col
								items-center justify-center
								h-full
								text_wrap
							'
						>
							<AnimatePresence mode='wait'>
								<motion.div
									className='title_wrap flex flex-col items-center'
									initial={{ opacity: 0, y: -12 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 6 }}
									transition={{ duration: 0.6 }}
									key={number}
								>
									<div className='icon_wrap flex items-center justify-center'>
										{feature_items[number].Icon}
									</div>
									<h2 className='feature_title'>
										{t(`Features.items.${number}.title`)}
									</h2>
								</motion.div>
							</AnimatePresence>
							<AnimatePresence mode='wait'>
								<motion.div
									className='desc flex flex-col'
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.6 }}
									key={number}
								>
									{t(`Features.items.${number}.desc`)
										.split('\n')
										.map((it, idx) => (
											<span className='line text-center' key={idx}>
												{it}
											</span>
										))}
								</motion.div>
							</AnimatePresence>
						</div>
						<AnimatePresence mode='wait'>
							<motion.div
								className='preview_image_wrap absolute flex w-full'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.35 }}
								key={number}
							>
								<motion.img
									className='preview_image'
									src={`/images/${image_name}.png`}
									alt={feature_items[number].key}
									initial={{ x: 220 }}
									animate={{ x: -220 }}
									transition={{ duration: feature_cycle_ms / 1000, ease: 'linear' }}
								/>
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</section>
		</div>
	)
}

export default $.memo(Index)
