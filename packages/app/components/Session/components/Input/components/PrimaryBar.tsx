import { PauseIcon, PlayIcon } from '@phosphor-icons/react'
import { Maximize } from 'lucide-react'

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
import { effort_modes, session_modes } from '../utils'

const Index = () => {
	const x = useModel()
	const Icon = x.props.streaming ? PauseIcon : PlayIcon

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
				{x.props.show_session_mode_select && (
					<Select
						items={session_modes}
						value={x.props.mode}
						onValueChange={value => value && x.props.setMode(value)}
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
								<SelectLabel>Mode</SelectLabel>
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
					onClick={x.props.streaming ? x.props.stop : x.onSend}
				>
					<Icon className='fill-std-white h-[10px] w-[10px]' weight='fill'></Icon>
				</button>
			</div>
		</div>
	)
}

export default Index
