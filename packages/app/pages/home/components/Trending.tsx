import { Activity, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltipContent } from '@/__shadcn__/components/ui/chart'

import { useModel } from '../context'

const chart_card_class = 'min-w-0 rounded-2xl border border-border/70 p-4'
const chart_height_class = 'h-[180px] min-h-[180px]'
const horizontal_grid_props = {
	vertical: false,
	stroke: 'var(--color-border-light)',
	strokeDasharray: '4 4'
} as const

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
				flex
				items-center justify-center
				gap-3
				mt-1
				text-xs text-std-400
			'
		>
			{props.items.map(item => (
				<div className='flex items-center gap-1.5' key={item.key}>
					<span className='size-2 rounded-full' style={{ backgroundColor: item.color }} />
					<span>{item.label}</span>
				</div>
			))}
		</div>
	)
}

const Index = () => {
	const x = useModel()

	return (
		<div className='flex flex-col gap-3'>
			<div
				className='
					flex
					items-center
					pl-2
					text-std-600 text-sm font-semibold leading-none
					border-l-2 border-std-500
				'
			>
				Trending
			</div>
			<div className='flex flex-col'>
				<div
					className='
						grid grid-cols-2
						border border-border-light
					'
				>
					{x.activity_window_items.map(item => (
						<div
							className='
								flex flex-col
								gap-2
								px-4 py-3.5
								border-r border-border-light
								last:border-r-0
							'
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
							<div className='text-std-300 text-xs'>{item.desc}</div>
						</div>
					))}
				</div>
				<div className='flex flex-col'>
					<div
						className='
							flex flex-col
							p-4
							border-border-light border-x
						'
					>
						<div
							className='
								flex flex-wrap
								items-start justify-between
								gap-3
								mb-4
							'
						>
							<div className='flex flex-col gap-0.5 text-xs'>
								<div className='text-std-400 font-medium uppercase'>
									Token throughput
								</div>
								<div className='text-std-300'>{x.token_trend_summary}</div>
							</div>
						</div>
						<ChartContainer className='h-[210px] min-h-[210px]' config={x.token_trend_config}>
							<LineChart data={x.trends} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
								<CartesianGrid {...horizontal_grid_props} />
								<XAxis
									axisLine={false}
									dataKey='label'
									minTickGap={24}
									tickLine={false}
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
						<ChartContainer
							className={`mt-5${chart_height_class}`}
							config={x.activity_trend_config}
						>
							<LineChart
								data={x.trends}
								margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
							>
								<CartesianGrid {...horizontal_grid_props} />
								<XAxis
									axisLine={false}
									dataKey='label'
									minTickGap={24}
									tickLine={false}
								/>
								<YAxis
									allowDecimals={false}
									axisLine={false}
									tickLine={false}
									width={32}
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
								{ key: 'new_sessions', label: 'Sessions', color: '#607D8B' },
								{ key: 'rewire_events', label: 'Rewires', color: '#f43f5e' }
							]}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

export default observer(Index)
