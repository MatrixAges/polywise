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
import AgentAvatar from './AgentAvatar'
import EditableField from './EditableField'
import SkillSelect from './SkillSelect'

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
	const { edit_field_key, startEditField, cancelEditField, submitEditableField, setModel, setModelEffort } =
		useModel()

	return (
		<div className='flex flex-col p-4'>
			<div className='flex items-center gap-3'>
				<AgentAvatar item={agent} size='large'></AgentAvatar>
				<div
					className='
						flex flex-1 flex-col
						min-w-0
						gap-3
					'
				>
					<div className='flex flex-col'>
						{edit_field_key === 'name' ? (
							<EditableField
								className='text-base! font-semibold'
								active
								value={agent.name}
								maxLength={24}
								onSubmit={value =>
									submitEditableField({
										id: agent.id,
										key: 'name',
										value
									})
								}
								onCancel={cancelEditField}
							></EditableField>
						) : (
							<div
								className='text-base leading-5.5 font-semibold'
								onClick={() => startEditField('name')}
							>
								{agent.name}
							</div>
						)}
						{edit_field_key === 'description' ? (
							<EditableField
								className='text-std-400 text-sm! leading-5.5'
								active
								value={agent.description || ''}
								placeholder='Add a short description for this agent'
								maxLength={60}
								onSubmit={value =>
									submitEditableField({
										id: agent.id,
										key: 'description',
										value
									})
								}
								onCancel={cancelEditField}
							></EditableField>
						) : (
							<div
								className='text-std-400 text-sm leading-5.5'
								onClick={() => startEditField('description')}
							>
								{agent.description || 'Add a short description for this agent'}
							</div>
						)}
					</div>
				</div>
			</div>
			{/* <div
				className='
					flex flex-col
					w-full max-w-md
					gap-4
					xl:pl-4
				'
			>
				<div className='flex flex-col gap-2'>
					<span
						className='
							text-std-400 text-xs font-medium tracking-[0.16em]
							uppercase
						'
					>
						Model
					</span>
					<ModelSelect value={agent.model} onChange={setModel}></ModelSelect>
				</div>
				<div className='flex flex-col gap-2'>
					<span
						className='
							text-std-400 text-xs font-medium tracking-[0.16em]
							uppercase
						'
					>
						Effort
					</span>
					<Select
						items={effort_modes}
						value={agent.model?.effort ?? 'default'}
						onValueChange={value => {
							if (!value) return
							void setModelEffort(value)
						}}
					>
						<SelectTrigger className='w-full justify-between'>
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
				<div
					className='
						p-3
						bg-secondary/20
						border border-border-light
					'
				>
					<SkillSelect></SkillSelect>
				</div>
			</div> */}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
