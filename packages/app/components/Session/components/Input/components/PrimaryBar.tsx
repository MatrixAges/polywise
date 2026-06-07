import { PauseIcon, PlayIcon } from '@phosphor-icons/react'
import { Maximize } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { ModelSelect } from '@/components'

import { useModel } from '../context'
import { getEffortModes, getSessionModes } from '../utils'

import type { IPropsInput } from '../../../types'

type Props = Pick<IPropsInput, 'mode' | 'setMode' | 'show_session_mode_select' | 'stop' | 'streaming'>

const Index = (props: Props) => {
	const x = useModel()
	const { t } = useTranslation('components')
	const Icon = props.streaming ? PauseIcon : PlayIcon
	const effort_modes = getEffortModes(t as unknown as (key: string, options?: Record<string, unknown>) => string)
	const session_modes = getSessionModes(t as unknown as (key: string, options?: Record<string, unknown>) => string)

	return (
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
				<button className='icon_button' onClick={x.toggleFull}>
					<Maximize></Maximize>
				</button>
				<ModelSelect ghost value={x.default_model} onChange={x.onChangeDefaultMode}></ModelSelect>
				<Select
					items={effort_modes}
					value={x.default_effort}
					onValueChange={value => value && x.onChangeDefaultEffort(value)}
				>
					<SelectTrigger
						className='
							h-auto!
							p-0
							ml-1
							text-xsm! text-std-400
							bg-transparent
						'
						noActiveStyle
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent className='w-[120px]' alignItemWithTrigger={false} side='top'>
						<SelectGroup>
							<SelectLabel>{t('session.input.effort')}</SelectLabel>
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
				{props.show_session_mode_select && (
					<Select
						items={session_modes}
						value={props.mode}
						onValueChange={value => value && props.setMode(value)}
					>
						<SelectTrigger
							className='
								h-auto!
								p-0
								text-xsm! text-std-400
								bg-transparent
							'
							noActiveStyle
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent className='w-[120px]' alignItemWithTrigger={false} side='top'>
							<SelectGroup>
								<SelectLabel>{t('session.input.mode')}</SelectLabel>
								{session_modes.map(item => (
									<SelectItem value={item.value} key={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				)}
				<button
					className='icon_button primary h-6 w-6'
					onClick={props.streaming ? props.stop : x.onSend}
				>
					<Icon className='fill-std-white h-[10px] w-[10px]' weight='fill'></Icon>
				</button>
			</div>
		</div>
	)
}

export default observer(Index)
