import { observer } from 'mobx-react-lite'

import { ModelSelect, TextTabs } from '@/components'

import { useModel } from '../context'
import AgentAvatar from './AgentAvatar'
import ArticlesPanel from './ArticlesPanel'
import AvatarDialog from './AvatarDialog'
import EditableField from './EditableField'
import SessionsPanel from './SessionsPanel'
import SkillSelect from './SkillSelect'

const tabs = ['sessions', 'prompt', 'soul', 'identity', 'memory', 'article'] as const

const Index = () => {
	const {
		selected_agent,
		current_tab,
		edit_field_key,
		setCurrentTab,
		startEditField,
		cancelEditField,
		submitEditableField,
		setModel,
		openAvatarDialog
	} = useModel()

	if (!selected_agent) {
		return (
			<div
				className='
					flex flex-1
					items-center justify-center
					text-sm text-std-400
				'
			>
				Select an agent
			</div>
		)
	}

	const tab_value = selected_agent[current_tab] || ''

	return (
		<div
			className='
				overflow-hidden
				flex flex-1 flex-col
				min-w-0
			'
		>
			<div
				className='
					overflow-y-scroll
					flex flex-1 flex-col
					min-h-0
					p-4
				'
			>
				<div className='flex flex-col gap-4'>
					<button className='w-fit' type='button' onClick={openAvatarDialog}>
						<AgentAvatar item={selected_agent} size='large'></AgentAvatar>
					</button>
					<div className='flex flex-col gap-2'>
						{edit_field_key === 'name' ? (
							<EditableField
								active
								value={selected_agent.name}
								onSubmit={value =>
									submitEditableField({ id: selected_agent.id, key: 'name', value })
								}
								onCancel={cancelEditField}
							></EditableField>
						) : (
							<div
								className='clickable text-xl font-semibold'
								onClick={() => startEditField('name')}
							>
								{selected_agent.name}
							</div>
						)}
						{edit_field_key === 'description' ? (
							<EditableField
								active
								value={selected_agent.description || ''}
								placeholder='Description'
								onSubmit={value =>
									submitEditableField({
										id: selected_agent.id,
										key: 'description',
										value
									})
								}
								onCancel={cancelEditField}
							></EditableField>
						) : (
							<div
								className='text-std-400 clickable text-sm'
								onClick={() => startEditField('description')}
							>
								{selected_agent.description || 'Add description'}
							</div>
						)}
					</div>
					<div className='flex max-w-md flex-col gap-2'>
						<span className='text-std-400 text-xs font-medium uppercase'>Model</span>
						<div className='max-w-sm'>
							<ModelSelect value={selected_agent.model} onChange={setModel}></ModelSelect>
						</div>
					</div>
					<SkillSelect></SkillSelect>
					<div className='border-border-light flex h-8 border-b'>
						<TextTabs
							items={[...tabs]}
							active={current_tab}
							setActive={setCurrentTab}
						></TextTabs>
					</div>
					<div className='min-h-[360px]'>
						{current_tab === 'sessions' ? (
							<SessionsPanel></SessionsPanel>
						) : current_tab === 'article' ? (
							<ArticlesPanel></ArticlesPanel>
						) : edit_field_key === current_tab ? (
							<EditableField
								active
								multiline
								value={tab_value}
								placeholder={`Edit ${current_tab}`}
								onSubmit={value =>
									submitEditableField({
										id: selected_agent.id,
										key: current_tab,
										value
									})
								}
								onCancel={cancelEditField}
							></EditableField>
						) : (
							<div
								className='
											min-h-[240px]
											p-3
											rounded-xl
											text-sm
											whitespace-pre-wrap
											border border-border-light
											clickable
										'
								onClick={() => startEditField(current_tab)}
							>
								{tab_value || `Add ${current_tab}`}
							</div>
						)}
					</div>
				</div>
			</div>
			<AvatarDialog></AvatarDialog>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
