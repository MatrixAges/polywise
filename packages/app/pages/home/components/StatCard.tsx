import { Activity, Bell, Bot, FileStack, GitBranch, MessageSquare, Sparkles, Workflow } from 'lucide-react'

import type { HomeOverviewTone } from '../types'

const icon_map = {
	sessions: Activity,
	running: Bot,
	unread: Bell,
	messages: MessageSquare,
	tokens: Sparkles,
	posts: FileStack,
	pipeline: GitBranch,
	graph: Workflow
} as const

const Index = (props: { title: string; value: string; desc: string; tone_key: HomeOverviewTone }) => {
	const Icon = icon_map[props.tone_key]

	return (
		<div
			className='
				flex flex-col
				gap-2
				px-4 py-3.5
				border-r border-border-light border-b
				even:border-r-0
			'
		>
			<div
				className='
					flex
					items-center justify-between
					text-std-400 text-xs font-medium
					uppercase
				'
			>
				{props.title} <Icon className='size-3' />
			</div>
			<div className='font-mono text-2xl font-semibold tracking-tight'>{props.value}</div>
			<div className='text-std-300 text-xs'>{props.desc}</div>
		</div>
	)
}

export default Index
