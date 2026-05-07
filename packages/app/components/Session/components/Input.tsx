import { useLayoutEffect, useRef } from 'react'
import { PauseIcon, PlayIcon } from '@phosphor-icons/react'
import { useMemoizedFn, useToggle } from 'ahooks'
import { Archive, ArrowDownToLine, BrushCleaning, Layers2, Maximize, PackageOpen } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { ModelSelect, Show, Tooltip } from '@/components'
import { useGlobal } from '@/context'

import type { AppConfig } from '@core/types'
import type { KeyboardEvent } from 'react'
import type { IPropsInput } from '../types'

const submit_modes = [
	{ label: 'Enter Mode', value: 'enter' },
	{ label: 'Ctrl+Enter Mode', value: 'ctrl+enter' }
]

const session_modes = [
	{ label: 'Normal', value: 'normal' },
	{ label: 'Plan', value: 'plan' },
	{ label: 'Plan-Exec', value: 'plan-exec' }
]

const effort_modes = [
	{ label: 'Default', value: 'default' },
	{ label: 'Low', value: 'low' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'High', value: 'high' },
	{ label: 'XHigh', value: 'xhigh' }
]

const Index = (props: IPropsInput) => {
	const {
		type,
		streaming,
		archived,
		mode,
		send,
		stop,
		clear,
		archive,
		unarchive,
		scrollToBottom,
		toggleContextModal,
		setMode
	} = props
	const global = useGlobal()
	const ref = useRef<HTMLTextAreaElement>(null)
	const [compositing, { setLeft, setRight }] = useToggle(false)
	const [full, { toggle: toggleFull }] = useToggle(false)

	const s = global.setting
	const is_page = type === 'page' || type === 'dialog'

	useLayoutEffect(() => {
		const el = ref.current

		if (!el) return

		el.addEventListener('compositionstart', setRight)
		el.addEventListener('compositionend', setLeft)

		return () => {
			el.removeEventListener('compositionstart', setRight)
			el.removeEventListener('compositionend', setLeft)
		}
	}, [])

	const onChangeDefaultMode = useMemoizedFn(v => {
		s.setConfig('config', { default_model: v } as AppConfig, true)
	})

	const onChangeDefaultEffort = useMemoizedFn(v => {
		const default_model = s.config?.default_model

		if (!default_model) return

		s.setConfig('config', { default_model: { ...default_model, effort: v } } as AppConfig, true)
	})

	const onChangeSubmitMode = useMemoizedFn(v => {
		s.setConfig('config', { submit_mode: v } as AppConfig, true)
	})

	const onSend = useMemoizedFn(() => {
		if (streaming || compositing) return

		const value = ref.current?.value

		if (!value) return

		send(value)

		ref.current!.value = ''
	})

	const onSubmit = useMemoizedFn((e: KeyboardEvent<HTMLTextAreaElement>) => {
		const submit_mode = s.config?.submit_mode || 'enter'
		const textarea = e.currentTarget

		if (streaming || compositing) return

		if (submit_mode === 'enter') {
			if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
				e.preventDefault()

				return onSend()
			}

			if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault()

				textarea.setRangeText('\n', textarea.selectionStart, textarea.selectionEnd, 'end')
				textarea.dispatchEvent(new Event('input', { bubbles: true }))

				return
			}
		} else {
			if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault()

				return onSend()
			}
		}
	})

	const Icon = streaming ? PauseIcon : PlayIcon
	const RightArchiveIcon = archived ? PackageOpen : Archive

	return (
		<div
			className={$cx(
				'relative w-full px-3',
				full &&
					`
				absolute!
				z-50
				h-full
				pt-3
				backdrop-blur-lg
			`,
				is_page && 'page_wrap py-0',
				type === 'dialog' && 'px-px!'
			)}
		>
			<div className={$cx('flex flex-col', full && 'h-full')}>
				<div
					className='
						flex flex-col flex-1
						rounded-lg
						bg-card
						border-t border-border-light/36
						shadow
					'
				>
					<Textarea
						className={$cx(
							`
							min-h-[54px] max-h-[300px]
							pb-0
							bg-transparent
							border-none
							focus-visible:ring-0
						`,
							full && 'h-full max-h-full'
						)}
						ref={ref}
						autoFocus
						placeholder='What would you like to know?'
						maxLength={9999}
						onKeyDown={onSubmit}
					></Textarea>
					<div
						className='
							flex
							items-center justify-between
							w-full
							px-2 py-1
							rounded-lg
							bg-card
						'
					>
						<div className='flex items-center gap-1.5'>
							<button className='icon_button' onClick={toggleFull}>
								<Maximize></Maximize>
							</button>
							<ModelSelect
								ghost
								value={s.config?.default_model}
								onChange={onChangeDefaultMode}
							></ModelSelect>
							<Select
								items={effort_modes}
								value={s.config?.default_model?.effort ?? 'default'}
								onValueChange={onChangeDefaultEffort}
							>
								<SelectTrigger
									className='
										h-auto!
										p-0
										ml-1
										text-xsm! text-std-400
										bg-transparent
									'
									no_active_style
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent
									className='w-[120px]'
									alignItemWithTrigger={false}
									side='top'
								>
									<SelectGroup>
										<SelectLabel>Effort</SelectLabel>
										{effort_modes.map(item => (
											<SelectItem value={item.value} key={item.value}>
												{item.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className='flex items-center gap-3'>
							<Select items={session_modes} value={mode} onValueChange={setMode}>
								<SelectTrigger
									className='
										h-auto!
										p-0
										text-xsm! text-std-400
										bg-transparent
									'
									no_active_style
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent
									className='w-[120px]'
									alignItemWithTrigger={false}
									side='top'
								>
									<SelectGroup>
										<SelectLabel>Mode</SelectLabel>
										{session_modes.map(item => (
											<SelectItem value={item.value} key={item.value}>
												{item.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							<button
								className='icon_button primary h-6 w-6'
								onClick={streaming ? stop : onSend}
							>
								<Icon className='fill-std-white h-[10px] w-[10px]' weight='fill'></Icon>
							</button>
						</div>
					</div>
				</div>
				<div
					className='
						flex
						items-center justify-between
						w-full
						px-2 py-1.5
						text-xs
					'
				>
					<div className='flex gap-1'>
						<Select
							items={submit_modes}
							value={s.config?.submit_mode ?? 'enter'}
							onValueChange={onChangeSubmitMode}
						>
							<SelectTrigger
								className='
									h-auto!
									p-0
									text-xs text-std-400
									bg-transparent
								'
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className='w-[180px]' align='start'>
								<SelectGroup>
									<SelectLabel>Submit Mode</SelectLabel>
									{submit_modes.map(item => (
										<SelectItem value={item.value} key={item.value}>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<Tooltip title='Clear'>
							<div className='icon_button h-5 w-5' onClick={clear}>
								<BrushCleaning className='stroke-std-400 h-[12px] w-[12px]'></BrushCleaning>
							</div>
						</Tooltip>
						<Show visible={archived}>
							<Tooltip title='Unarchive'>
								<div className='icon_button h-5 w-5' onClick={unarchive}>
									<Archive className='stroke-std-400 h-[12px] w-[12px]'></Archive>
								</div>
							</Tooltip>
						</Show>
					</div>
					<div className='flex gap-1'>
						<Tooltip title='Context'>
							<div className='icon_button h-5 w-5' onClick={toggleContextModal}>
								<Layers2 className='stroke-std-400 h-[12px] w-[12px]'></Layers2>
							</div>
						</Tooltip>
						<Tooltip title='Scroll to bottom'>
							<div className='icon_button h-5 w-5' onClick={scrollToBottom}>
								<ArrowDownToLine className='stroke-std-400 h-[12px] w-[12px]'></ArrowDownToLine>
							</div>
						</Tooltip>
						<Tooltip title='Archive'>
							<div className='icon_button h-5 w-5' onClick={archive}>
								<RightArchiveIcon className='stroke-std-400 h-[12px] w-[12px]'></RightArchiveIcon>
							</div>
						</Tooltip>
					</div>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
