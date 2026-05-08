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
		<div className='flex flex-col pt-2'>
			<div
				className='
					flex
					h-8
					px-6
					border-border-light border-b
				'
			>
				<TextTabs items={[...tabs]} active={active_tab} setActive={setCurrentTab}></TextTabs>
			</div>
			<div className='min-h-[420px] p-5'>
				{active_tab === 'article' ? (
					<ArticlesPanel></ArticlesPanel>
				) : (
					<Textarea
						className='
							min-h-[320px]
							p-4
							text-sm leading-6
							bg-secondary/10
							border-border-light
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
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
