import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

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
	const { t } = useTranslation('agent')

	return (
		<div className='flex w-full flex-col'>
			<div className='flex items-center justify-between gap-4'>
				<div className='flex min-w-0 items-center gap-4'>
					<AgentAvatar item={agent} size='large'></AgentAvatar>
					<div
						className='
							flex flex-col
							justify-center
							min-w-0
							gap-1
						'
					>
						<div className='flex min-w-0 items-center'>
							<div className='min-w-0'>
								{edit_field_key === 'name' ? (
									<EditableField
										class_name='w-auto! max-w-full text-lg! font-semibold'
										active
										auto_width
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
							</div>
							<div className='flex shrink-0 pl-2'>
								{edit_field_key === 'role' ? (
									<EditableField
										class_name='text-std-400 text-sm! font-medium leading-4.5'
										active
										value={agent.role}
										placeholder={t('info.role_placeholder')}
										max_length={20}
										on_submit={value =>
											submitEditableField({
												id: agent.id,
												key: 'role',
												value
											})
										}
										on_cancel={cancelEditField}
									></EditableField>
								) : (
									<button
										className='
											text-std-400 text-sm font-medium leading-4.5
											text-left
										'
										type='button'
										onClick={() => startEditField('role')}
									>
										{agent.role}
									</button>
								)}
							</div>
						</div>
						{edit_field_key === 'description' ? (
							<EditableField
								class_name='w-full text-std-400 text-sm! leading-4.5'
								active
								multiline
								value={agent.description || ''}
								placeholder={t('info.description_placeholder')}
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
								className='text-std-400 text-left text-sm leading-4.5'
								type='button'
								onClick={() => startEditField('description')}
							>
								{agent.description || t('info.description_placeholder')}
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
