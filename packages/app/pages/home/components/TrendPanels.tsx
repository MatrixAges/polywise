import { Activity, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltipContent } from '@/__shadcn__/components/ui/chart'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const chart_card_class = 'min-w-0 rounded-2xl border border-border/70 p-4'

const InlineLegend = (props: {
	items: Array<{
		key: string
		label: string
		color: string
	}>
}) => {
	return (
		<div
			className='
				flex flex-wrap
				items-center
				gap-3
				pt-3
				mt-4
				text-xs text-[rgba(var(--color_text_rgb),0.68)]
				border-border/60 border-t
			'
		>
			{props.items.map(item => (
				<div className='flex items-center gap-2' key={item.key}>
					<span className='size-2.5 rounded-[999px]' style={{ backgroundColor: item.color }} />
					<span>{item.label}</span>
				</div>
			))}
		</div>
	)
}

const Index = () => {
	const x = useModel()

	return (
		<SectionCard
			title='Trends'
			desc='Two consistent charts for the last 14 days: model throughput on one side, workspace activity on the other.'
		>
			<div className='grid gap-4 md:grid-cols-2'>
				<div className={chart_card_class}>
					<div
						className='
							flex flex-wrap
							items-start justify-between
							gap-3
						'
					>
						<div>
							<div
								className='
									flex
									items-center
									gap-2
									text-sm font-medium
								'
							>
								<Sparkles className='text-amber-600' />
								<span>Token throughput</span>
							</div>
							<div className='text-std-400 mt-1 text-sm'>{x.token_trend_summary}</div>
						</div>
					</div>
					<ChartContainer className='mt-5 h-[240px]' config={x.token_trend_config}>
						<LineChart data={x.trends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
							<CartesianGrid vertical={false} />
							<XAxis axisLine={false} dataKey='label' minTickGap={24} tickLine={false} />
							<YAxis
								axisLine={false}
								tickFormatter={value =>
									Number(value) >= 1000
										? `${Math.round(Number(value) / 1000)}k`
										: String(value)
								}
								tickLine={false}
								width={44}
							/>
							<Tooltip
								cursor={false}
								content={
									<ChartTooltipContent
										labelFormatter={(_, payload) =>
											String(payload?.[0]?.payload?.date ?? '')
										}
									/>
								}
							/>
							<Line
								dataKey='input_tokens'
								dot={false}
								stroke='var(--color-input_tokens)'
								strokeWidth={2}
								type='monotone'
							/>
							<Line
								dataKey='output_tokens'
								dot={false}
								stroke='var(--color-output_tokens)'
								strokeWidth={2}
								type='monotone'
							/>
							<Line
								dataKey='reasoning_tokens'
								dot={false}
								stroke='var(--color-reasoning_tokens)'
								strokeWidth={2}
								type='monotone'
							/>
						</LineChart>
					</ChartContainer>
					<InlineLegend
						items={[
							{ key: 'input_tokens', label: 'Input', color: '#38bdf8' },
							{ key: 'output_tokens', label: 'Output', color: '#34d399' },
							{ key: 'reasoning_tokens', label: 'Reasoning', color: '#f97316' }
						]}
					/>
				</div>

				<div className={chart_card_class}>
					<div
						className='
							flex
							items-center
							gap-2
							text-sm font-medium
						'
					>
						<Activity className='text-sky-600' />
						<span>Workspace activity</span>
					</div>
					<div className='text-std-400 mt-1 text-sm'>{x.activity_trend_summary}</div>
					<ChartContainer className='mt-5 h-[240px]' config={x.activity_trend_config}>
						<LineChart data={x.trends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
							<CartesianGrid vertical={false} />
							<XAxis axisLine={false} dataKey='label' minTickGap={24} tickLine={false} />
							<YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} />
							<Tooltip
								cursor={false}
								content={
									<ChartTooltipContent
										labelFormatter={(_, payload) =>
											String(payload?.[0]?.payload?.date ?? '')
										}
									/>
								}
							/>
							<Line
								dataKey='messages'
								dot={false}
								stroke='var(--color-messages)'
								strokeWidth={2}
								type='monotone'
							/>
							<Line
								dataKey='new_posts'
								dot={false}
								stroke='var(--color-new_posts)'
								strokeWidth={2}
								type='monotone'
							/>
							<Line
								dataKey='new_sessions'
								dot={false}
								stroke='var(--color-new_sessions)'
								strokeWidth={2}
								type='monotone'
							/>
							<Line
								dataKey='rewire_events'
								dot={false}
								stroke='var(--color-rewire_events)'
								strokeWidth={2}
								type='monotone'
							/>
						</LineChart>
					</ChartContainer>
					<InlineLegend
						items={[
							{ key: 'messages', label: 'Messages', color: '#6366f1' },
							{ key: 'new_posts', label: 'Posts', color: '#10b981' },
							{ key: 'new_sessions', label: 'Sessions', color: '#8b5cf6' },
							{ key: 'rewire_events', label: 'Rewires', color: '#f43f5e' }
						]}
					/>
				</div>
			</div>
		</SectionCard>
	)
}

export default observer(Index)
