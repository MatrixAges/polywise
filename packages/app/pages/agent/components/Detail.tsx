import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { match } from 'ts-pattern'

import { Textarea } from '@/__shadcn__/components/ui/textarea'

import { useModel } from '../context'
import BrainPanel from './BrainPanel'
import DetailInfo from './DetailInfo'
import DetailMenu from './DetailMenu'
import GraphPanel from './GraphPanel'
import SkillSelect from './SkillSelect'

import type { AgentTab } from '../types'

type DetailTab = Exclude<AgentTab, 'sessions'>
type TextTab = keyof typeof placeholder_map

const placeholder_map = {
	prompt: 'How agent run',
	soul: "What's in agent's mind",
	identity: 'Who agent is',
	memory: 'Core memory'
} as const

const isTextTab = (tab: DetailTab): tab is TextTab => tab in placeholder_map

const Index = () => {
	const { selected_agent, current_tab, submitEditableField } = useModel()
	const active_tab: DetailTab = current_tab === 'sessions' ? 'info' : current_tab
	const field_value =
		selected_agent && isTextTab(active_tab)
			? (selected_agent[active_tab] as string | null | undefined) || ''
			: ''
	const [draft_value, setDraftValue] = useState(field_value)

	useEffect(() => {
		setDraftValue(field_value)
	}, [active_tab, field_value])

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

	return (
		<div
			className='
				flex flex-1
				min-h-0
			'
		>
			<DetailMenu active_tab={active_tab}></DetailMenu>
			{match(active_tab)
				.with('info', () => <DetailInfo agent={selected_agent}></DetailInfo>)
				.with('content', () => <BrainPanel></BrainPanel>)
				.with('graph', () => <GraphPanel agent={selected_agent}></GraphPanel>)
				.with('skills', () => <SkillSelect></SkillSelect>)
				.when(isTextTab, text_tab => (
					<Textarea
						className='
						overflow-y-auto
						flex-1
						h-full
						min-h-0
						p-4 px-6
						rounded-none
						text-sm!
						bg-secondary/10
						border-none
						focus-within:ring-0!
					'
						value={draft_value}
						placeholder={placeholder_map[text_tab]}
						onChange={event => {
							setDraftValue(event.target.value)
						}}
						onBlur={event => {
							submitEditableField({
								id: selected_agent.id,
								key: text_tab,
								value: event.target.value
							})
						}}
					></Textarea>
				))
				.exhaustive()}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
