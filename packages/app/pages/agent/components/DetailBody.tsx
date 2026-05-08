import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { TextTabs } from '@/components'

import { useModel } from '../context'
import BrainPanel from './BrainPanel'
import SkillSelect from './SkillSelect'

import type { AgentItem, AgentTab } from '../types'

const tabs = [
	{ key: 'prompt', title: 'prompt' },
	{ key: 'soul', title: 'soul' },
	{ key: 'identity', title: 'identity' },
	{ key: 'memory', title: 'memory' },
	{ key: 'skills', title: 'skills' },
	{ key: 'article', title: 'Brain' }
] as const

const placeholder_map = {
	prompt: 'How you run',
	soul: "What\'s in your mind",
	identity: 'Who you are',
	memory: 'Core memory'
} as const

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
		<div
			className='
				flex flex-1 flex-col
				min-h-0
			'
		>
			<div
				className='
					flex shrink-0
					border-border-light border-b
				'
			>
				<div className='page_wrap h-8 px-6 py-0'>
					<TextTabs
						className='gap-4!'
						itemClassName='px-0!'
						items={[...tabs]}
						active={active_tab}
						setActive={setCurrentTab}
					></TextTabs>
				</div>
			</div>
			<div className='page_wrap flex-1 p-0'>
				{active_tab === 'article' ? (
					<BrainPanel></BrainPanel>
				) : active_tab === 'skills' ? (
					<div className='px-6 py-3'>
						<SkillSelect></SkillSelect>
					</div>
				) : (
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
						placeholder={placeholder_map[active_tab]}
						onChange={event => {
							setDraftValue(event.target.value)
						}}
						onBlur={event => {
							submitEditableField({
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
