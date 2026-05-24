'use client'

import { useMemo, useRef, useState } from 'react'
import { ArrowDown, MouseSimple } from '@phosphor-icons/react'
import { modules_arr, modules_map } from '@website/appdata/app'
import { items } from '@website/appdata/features'
import { images_map } from '@website/appdata/modules'
import Logo from '@website/components/Logo'
import { useEventListener, useMemoizedFn } from '@website/hooks/ahooks'
import useGradient from '@website/hooks/useGradient'
import { Link } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

import styles from './index.module.css'

const Index = () => {
	const t = useTranslations('features')
	const t_index = useTranslations('index')
	const t_global = useTranslations('global')
	const [number, setNumber] = useState(0)
	const [step, setStep] = useState(0)
	const { gradient, makeGradient } = useGradient(0, 12)

	const { current: scroller } = useRef({
		is_scroll: true,
		scroll_time: 0,
		timer: null as unknown as NodeJS.Timer
	})

	const prevNumber = useMemoizedFn(() => {
		setNumber(number === 0 ? modules_arr.length - 1 : number - 1)
		makeGradient()
	})

	const nextNumber = useMemoizedFn(() => {
		setNumber(number === modules_arr.length - 1 ? 0 : number + 1)
		makeGradient()
	})

	const prevStep = useMemoizedFn(() => {
		if (step === 0) {
			prevNumber()
			setStep(0)

			return
		}

		setStep(step - 1)
		makeGradient()
	})

	const nextStep = useMemoizedFn(() => {
		if (step === views.length - 1) {
			nextNumber()
			setStep(0)

			return
		}

		setStep(step + 1)
		makeGradient()
	})

	const wheel = useMemoizedFn((e: WheelEvent) => {
		if (e.deltaY > 0) nextStep()
		if (e.deltaY < 0) prevStep()
	})

	const onWheel = useMemoizedFn((e: WheelEvent) => {
		const time = new Date().getTime()
		const y = e.deltaY

		if (scroller.scroll_time) {
			if (time - scroller.scroll_time > 600 && Math.abs(y) >= 120) {
				wheel(e)

				clearTimeout(scroller.timer)

				scroller.is_scroll = false
				scroller.scroll_time = time
			}
		}

		if (scroller.is_scroll) {
			wheel(e)

			scroller.scroll_time = new Date().getTime()
			scroller.is_scroll = false
		}

		if (scroller.timer) {
			clearTimeout(scroller.timer)
		}

		scroller.timer = setTimeout(() => {
			scroller.is_scroll = true
		}, 450)
	})

	useEventListener('wheel', onWheel)

	const module = useMemo(() => modules_arr[number].key, [number])
	const views = useMemo(() => items[number], [number])
	const view = useMemo(() => views[step], [views, step])

	return (
		<motion.div
			className={$.cx('relative flex h-screen w-screen', styles._local)}
			animate={gradient}
			transition={{ duration: 1.2 }}
		>
			<div
				className='
					relative
					box-border
					flex flex-col
					items-center justify-center
					left_wrap
				'
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
				<Link href='/'>
					<Logo className='logo clickable absolute' size={24} color='var(--color_text)'></Logo>
				</Link>
				<div className='modules_wrap absolute flex'>
					{modules_arr.map((item, index) => (
						<div
							className={$.cx(
								`
								flex
								items-center justify-center
								module_item clickable
							`,
								index === number && 'active'
							)}
							key={item.key}
							onClick={() => {
								setNumber(index)
								setStep(0)
								makeGradient()
							}}
						>
							{item.Icon}
						</div>
					))}
				</div>
				<div className='views_wrap absolute flex'>
					{views.map((_, index) => (
						<div
							className={$.cx(
								`
								flex
								items-center justify-center
								view_item clickable
							`,
								index === step && 'active'
							)}
							key={index}
							onClick={() => {
								if (index === step) return

								setStep(index)
								makeGradient()
							}}
						>
							{index + 1}
						</div>
					))}
				</div>
				<div
					className='
						relative
						box-border
						flex flex-col
						items-center justify-center
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
								{modules_map[number].Icon}
							</div>
							<h2 className='feature_title'>{t_index(`Features.items.${number}.title`)}</h2>
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
							{t_index(`Features.items.${number}.desc`)
								.split('\n')
								.map((it, idx) => (
									<span className='line text-center' key={idx}>
										{it}
									</span>
								))}
							<div className='link_wrap flex justify-center'>
								<button className='btn_link clickable'>
									{t_index(`Features.origin`)} &gt;
								</button>
							</div>
						</motion.div>
					</AnimatePresence>
					<div className='scroll_tip flex flex-col items-center'>
						<AnimatePresence mode='wait'>
							<motion.div
								initial={{ opacity: 0, y: -6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 6 }}
								transition={{ duration: 0.6 }}
								key={view}
							>
								<MouseSimple className='icon_mouse' size={24}></MouseSimple>
							</motion.div>
						</AnimatePresence>
						<AnimatePresence mode='wait'>
							<motion.div
								initial={{ opacity: 0, y: -12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 12 }}
								transition={{ duration: 0.3 }}
								key={view}
							>
								<ArrowDown className='icon_arrow' size={18}></ArrowDown>
							</motion.div>
						</AnimatePresence>
						{t_global('scroll')}
					</div>
				</div>
			</div>
			<div
				className='
					relative
					box-border
					flex flex-col
					items-center justify-center
					right_wrap
				'
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
				<div
					className='
						flex flex-col
						items-center
						w-full
						view_wrap
					'
				>
					<AnimatePresence mode='wait'>
						<motion.img
							initial={{ opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 6 }}
							transition={{ duration: 0.6 }}
							src={`/images/preview/${module}/${images_map[module]?.[step]}.png`}
							alt={view}
							key={view}
						/>
					</AnimatePresence>
					<AnimatePresence mode='wait'>
						<motion.h2
							initial={{ opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 6 }}
							key={view}
						>
							{t(`${module}.${step}.title`)}
						</motion.h2>
					</AnimatePresence>
					<AnimatePresence mode='wait'>
						<motion.span
							className='desc text-center'
							initial={{ opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 6 }}
							key={view}
						>
							{t(`${module}.${step}.desc`)}
						</motion.span>
					</AnimatePresence>
				</div>
			</div>
		</motion.div>
	)
}

export default Index
