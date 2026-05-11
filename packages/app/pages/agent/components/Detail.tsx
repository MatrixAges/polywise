import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { match } from 'ts-pattern'

import Editor from '@/components/Editor'

import { useModel } from '../context'
import ContentPanel from './ContentPanel'
import DetailInfo from './DetailInfo'
import DetailMenu from './DetailMenu'
import GraphPanel from './GraphPanel'
import SkillsPanel from './SkillsPanel'
import ToolsPanel from './ToolsPanel'

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
	const [editor_version, setEditorVersion] = useState(0)

	useEffect(() => {
		setDraftValue(field_value)
		setEditorVersion(value => value + 1)
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
			<div
				className={$cx(
					'page_wrap p-0',
					!['content', 'graph'].includes(active_tab) && !isTextTab(active_tab) && 'p-6'
				)}
			>
				{match(active_tab)
					.with('info', () => <DetailInfo agent={selected_agent}></DetailInfo>)
					.with('content', () => <ContentPanel></ContentPanel>)
					.with('graph', () => <GraphPanel agent={selected_agent}></GraphPanel>)
					.with('skills', () => <SkillsPanel></SkillsPanel>)
					.with('tools', () => <ToolsPanel></ToolsPanel>)
					.when(isTextTab, text_tab => (
						<div
							className='
							overflow-y-scroll
							flex-1
							h-full
							min-h-0
						'
						>
							<Editor
								id={`agent-${selected_agent.id}-${text_tab}`}
								className='pt-6!'
								value={draft_value}
								onChange={setDraftValue}
								onBlur={value => {
									submitEditableField({
										id: selected_agent.id,
										key: text_tab,
										value
									})
								}}
								key={`${selected_agent.id}-${text_tab}-${editor_version}`}
							></Editor>
						</div>
					))
					.exhaustive()}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
