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

const tone_map = {
	sessions: 'text-sky-600',
	running: 'text-violet-600',
	unread: 'text-amber-600',
	messages: 'text-indigo-600',
	tokens: 'text-orange-600',
	posts: 'text-emerald-600',
	pipeline: 'text-fuchsia-600',
	graph: 'text-rose-600'
} as const

const Index = (props: { title: string; value: string; desc: string; tone_key: HomeOverviewTone }) => {
	const Icon = icon_map[props.tone_key]
	const tone = tone_map[props.tone_key]

	return (
		<div
			className='
				p-4
				rounded-2xl
				border border-border/70
			'
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0'>
					<div className='text-std-400 text-[11px] tracking-[0.22em] uppercase'>{props.title}</div>
					<div
						className='
							mt-3
							text-[1.75rem] font-semibold leading-none tracking-tight
						'
					>
						{props.value}
					</div>
					<div className='text-std-400 mt-2 text-sm leading-5'>{props.desc}</div>
				</div>
				<Icon className={`mt-0.5 size-4 shrink-0${tone}`} />
			</div>
		</div>
	)
}

export default Index
