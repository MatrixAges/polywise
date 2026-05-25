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
import { ModelSelect } from '@/components'

import { useModel } from '../context'

import type { AgentItem } from '../types'

const effort_modes = [
	{ label: 'Default', value: 'default' },
	{ label: 'None', value: 'none' },
	{ label: 'Minimal', value: 'minimal' },
	{ label: 'Low', value: 'low' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'High', value: 'high' },
	{ label: 'XHigh', value: 'xhigh' },
	{ label: 'Max', value: 'max' }
]

interface IProps {
	agent: AgentItem
}

const Index = ({ agent }: IProps) => {
	const { can_edit_selected_agent_behavior, setModel, setModelEffort } = useModel()

	return (
		<div className='-mb-1 flex flex-col'>
			<div className='flex items-center gap-2'>
				<span className='text-std-400 text-xs'>Model</span>
				{!can_edit_selected_agent_behavior ? (
					<span className='text-std-300 text-[10px] uppercase'>Frozen</span>
				) : null}
			</div>
			<div
				className={$cx(
					'flex items-center gap-2',
					!can_edit_selected_agent_behavior && 'pointer-events-none opacity-50'
				)}
			>
				<ModelSelect
					ghost
					inputGroupClassName='h-6'
					inputClassName='w-auto! p-0! h-6!'
					filterType='text'
					showTrigger={false}
					value={agent.model}
					onChange={setModel}
				></ModelSelect>
				<Select
					items={effort_modes}
					value={agent.model?.effort || 'Default'}
					disabled={!can_edit_selected_agent_behavior}
					onValueChange={value => {
						if (!value) return

						setModelEffort(value)
					}}
				>
					<SelectTrigger
						className='
							justify-between
							w-auto! h-6!
							p-0
							text-sm text-std-400
							bg-transparent
						'
						noStyle
						noActiveStyle
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Reasoning Effort</SelectLabel>
							{effort_modes.map(item => (
								<SelectItem value={item.value} key={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
