import { Activity, BrainCircuit, FileStack, Sparkles } from 'lucide-react'

type ToneKey = 'sessions' | 'tokens' | 'content' | 'memory'

const icon_map = {
	sessions: Activity,
	tokens: Sparkles,
	content: FileStack,
	memory: BrainCircuit
} as const

const tone_map = {
	sessions: 'bg-sky-500/12 text-sky-600',
	tokens: 'bg-amber-500/12 text-amber-600',
	content: 'bg-emerald-500/12 text-emerald-600',
	memory: 'bg-rose-500/12 text-rose-600'
} as const

const Index = (props: { title: string; value: string; desc: string; tone_key: ToneKey }) => {
	const Icon = icon_map[props.tone_key]
	const tone = tone_map[props.tone_key]

	return (
		<div
			className='
				p-4
				rounded-3xl
				bg-background/85
				border border-border/70
				shadow-sm
				backdrop-blur-sm
			'
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0'>
					<div className='text-std-400 text-xs tracking-[0.22em] uppercase'>{props.title}</div>
					<div className='mt-3 text-3xl font-semibold tracking-tight'>{props.value}</div>
					<div className='text-std-400 mt-2 text-sm leading-5'>{props.desc}</div>
				</div>
				<div
					className={`
						flex shrink-0
						items-center justify-center
						size-10
						rounded-2xl
						${tone}
					`}
				>
					<Icon className='size-4' />
				</div>
			</div>
		</div>
	)
}

export default Index
