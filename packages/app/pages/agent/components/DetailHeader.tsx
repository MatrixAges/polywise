import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import AgentAvatar from './AgentAvatar'
import AgentModel from './AgentModel'
import EditableField from './EditableField'

import type { AgentItem } from '../types'

interface IProps {
	agent: AgentItem
}

const Index = ({ agent }: IProps) => {
	const { edit_field_key, startEditField, cancelEditField, submitEditableField } = useModel()

	return (
		<div
			className='
				flex
				items-center
				gap-3
				p-6
				pb-4
				page_wrap
			'
		>
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
							class_name='text-base! font-semibold'
							active
							value={agent.name}
							max_length={24}
							on_submit={value =>
								submitEditableField({
									id: agent.id,
									key: 'name',
									value
								})
							}
							on_cancel={cancelEditField}
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
							class_name='text-std-400 text-sm! leading-5.5'
							active
							value={agent.description || ''}
							placeholder='Add a short description for this agent'
							max_length={60}
							on_submit={value =>
								submitEditableField({
									id: agent.id,
									key: 'description',
									value
								})
							}
							on_cancel={cancelEditField}
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
			<AgentModel agent={agent}></AgentModel>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
