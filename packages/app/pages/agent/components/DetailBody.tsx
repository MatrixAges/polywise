import { observer } from 'mobx-react-lite'

import { TextTabs } from '@/components'

import { useModel } from '../context'
import ArticlesPanel from './ArticlesPanel'
import EditableField from './EditableField'

import type { AgentItem, AgentTab } from '../types'

const tabs = ['prompt', 'soul', 'identity', 'memory', 'article'] as const

interface IProps {
	agent: AgentItem
	active_tab: Exclude<AgentTab, 'sessions'>
	field_value: string
}

const Index = ({ agent, active_tab, field_value }: IProps) => {
	const { edit_field_key, setCurrentTab, startEditField, cancelEditField, submitEditableField } = useModel()

	return (
		<div
			className='
				overflow-hidden
				bg-card
				border border-border-light
			'
		>
			<div
				className='
					flex
					h-11
					px-5
					border-border-light border-b
				'
			>
				<TextTabs items={[...tabs]} active={active_tab} setActive={setCurrentTab}></TextTabs>
			</div>
			<div className='min-h-[420px] p-5'>
				{active_tab === 'article' ? (
					<ArticlesPanel></ArticlesPanel>
				) : edit_field_key === active_tab ? (
					<EditableField
						active
						multiline
						value={field_value}
						placeholder={`Edit ${active_tab}`}
						onSubmit={value =>
							submitEditableField({
								id: agent.id,
								key: active_tab,
								value
							})
						}
						onCancel={cancelEditField}
					></EditableField>
				) : (
					<div
						className='
								min-h-[320px]
								p-4
								text-sm leading-6
								whitespace-pre-wrap
								bg-secondary/10
								border border-border-light
								clickable
							'
						onClick={() => startEditField(active_tab)}
					>
						{field_value || `Add ${active_tab}`}
					</div>
				)}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
