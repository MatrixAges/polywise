import { PauseIcon, PlayIcon } from '@phosphor-icons/react'
import { useMemoizedFn, useToggle } from 'ahooks'
import { BrushCleaning, Maximize } from 'lucide-react'
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
import { ModelSelect } from '@/components'
import { useGlobal } from '@/context'

import type { AppConfig } from '@core/types'
import type { KeyboardEvent } from 'react'
import type { IPropsInput } from '../types'

const submit_modes = [
	{ label: 'Enter Mode', value: 'enter' },
	{ label: 'Ctrl+Enter Mode', value: 'ctrl+enter' }
]

const Index = (props: IPropsInput) => {
	const { streaming, submit, clear } = props
	const global = useGlobal()
	const [full, { toggle: toggleFull }] = useToggle(false)

	const s = global.setting

	const onChangeDefaultMode = useMemoizedFn(v => {
		s.setConfig('config', { default_model: v } as AppConfig, true)
	})

	const onChangeSubmitMode = useMemoizedFn(v => {
		s.setConfig('config', { submit_mode: v } as AppConfig, true)
	})

	const onSubmit = useMemoizedFn((e: KeyboardEvent<HTMLTextAreaElement>) => {
		const submit_mode = s.config?.submit_mode || 'enter'
		const textarea = e.currentTarget

		if (submit_mode === 'enter') {
			if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
				e.preventDefault()

				if (!textarea.value) return

				submit({ text: textarea.value })
				return
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

				if (!textarea.value) return

				submit({ text: textarea.value })

				return
			}
		}
	})

	const Icon = streaming ? PauseIcon : PlayIcon

	return (
		<div className={$cx('w-full p-3 pb-0', full && 'absolute z-50 h-full')}>
			<div className={$cx('flex flex-col', full && 'h-full')}>
				<div
					className='
						flex flex-col flex-1
						rounded-lg
						bg-card
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
						<div className='flex items-center gap-2'>
							<button className='icon_button' onClick={toggleFull}>
								<Maximize></Maximize>
							</button>
							<ModelSelect ghost onChange={onChangeDefaultMode}></ModelSelect>
						</div>
						<button className='icon_button primary h-6 w-6'>
							<Icon className='fill-std-white h-[10px] w-[10px]' weight='fill'></Icon>
						</button>
					</div>
				</div>
				<div
					className='
						flex
						items-center justify-between
						w-full
						py-2
						text-xs
					'
				>
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
							<SelectValue className='' />
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
					<button className='icon_button h-5 w-5' onClick={clear}>
						<BrushCleaning className='stroke-std-400 h-[12px] w-[12px]'></BrushCleaning>
					</button>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
