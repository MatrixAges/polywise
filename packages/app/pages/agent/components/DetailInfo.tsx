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
		<div className='flex w-full flex-col p-6'>
			<div className='flex items-center justify-between gap-4'>
				<div className='flex items-center gap-4'>
					<AgentAvatar item={agent} size='large'></AgentAvatar>
					<div className='flex flex-col justify-center gap-1'>
						{edit_field_key === 'name' ? (
							<EditableField
								class_name='text-lg! font-semibold'
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
							<button
								className='
									min-w-0
									text-lg font-semibold leading-5.5
									text-left
								'
								type='button'
								onClick={() => startEditField('name')}
							>
								{agent.name}
							</button>
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
							<button
								className='text-std-400 text-left text-sm leading-5.5'
								type='button'
								onClick={() => startEditField('description')}
							>
								{agent.description || 'Add a short description for this agent'}
							</button>
						)}
					</div>
				</div>
				<AgentModel agent={agent}></AgentModel>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
