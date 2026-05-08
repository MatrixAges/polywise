import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { TextTabs } from '@/components'

import { useModel } from '../context'
import ArticlesPanel from './ArticlesPanel'

import type { AgentItem, AgentTab } from '../types'

const tabs = ['prompt', 'soul', 'identity', 'memory', 'article'] as const

interface IProps {
	agent: AgentItem
	active_tab: Exclude<AgentTab, 'sessions'>
	field_value: string
}

const Index = ({ agent, active_tab, field_value }: IProps) => {
	const { setCurrentTab, submitEditableField } = useModel()
	const [draft_value, setDraftValue] = useState(field_value)

	useEffect(() => {
		setDraftValue(field_value)
	}, [active_tab, field_value])

	return (
		<div className='flex min-h-0 flex-1 flex-col'>
			<div
				className='
					flex shrink-0
					h-8
					px-6
					border-border-light border-b
				'
			>
				<TextTabs
					className='gap-2'
					itemClassName='px-1.5'
					items={[...tabs]}
					active={active_tab}
					setActive={setCurrentTab}
				></TextTabs>
			</div>
			{active_tab === 'article' ? (
				<ArticlesPanel></ArticlesPanel>
			) : (
				<Textarea
					className='
						overflow-y-auto
						flex-1
						h-full
						min-h-0
						p-4 px-6
						rounded-none
						text-sm
						bg-secondary/10
						border-none
						focus-within:ring-0!
					'
					value={draft_value}
					placeholder={`Add ${active_tab}`}
					onChange={event => {
						setDraftValue(event.target.value)
					}}
					onBlur={event => {
						void submitEditableField({
							id: agent.id,
							key: active_tab,
							value: event.target.value
						})
					}}
				></Textarea>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
