import { Activity, BrainCircuit, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent
} from '@/__shadcn__/components/ui/chart'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const chart_card_class = 'bg-secondary/60 rounded-3xl p-4'

const Index = () => {
	const x = useModel()

	return (
		<SectionCard
			title='Signal Trends'
			desc='过去 14 天的 token、内容流动和 agentic 认知循环，不再只看静态总量。'
		>
			<div className='grid gap-3 xl:grid-cols-2'>
				<div className={`${chart_card_class}xl:col-span-2`}>
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
								<span>AI Token Flow</span>
							</div>
							<div className='text-std-400 mt-1 text-sm'>{x.token_trend_summary}</div>
						</div>
					</div>
					<ChartContainer className='mt-4 h-[280px]' config={x.token_trend_config}>
						<AreaChart data={x.trends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
							<defs>
								<linearGradient id='fill-input-tokens' x1='0' y1='0' x2='0' y2='1'>
									<stop
										offset='5%'
										stopColor='var(--color-input_tokens)'
										stopOpacity={0.28}
									/>
									<stop
										offset='95%'
										stopColor='var(--color-input_tokens)'
										stopOpacity={0.03}
									/>
								</linearGradient>
								<linearGradient id='fill-output-tokens' x1='0' y1='0' x2='0' y2='1'>
									<stop
										offset='5%'
										stopColor='var(--color-output_tokens)'
										stopOpacity={0.3}
									/>
									<stop
										offset='95%'
										stopColor='var(--color-output_tokens)'
										stopOpacity={0.04}
									/>
								</linearGradient>
								<linearGradient id='fill-reasoning-tokens' x1='0' y1='0' x2='0' y2='1'>
									<stop
										offset='5%'
										stopColor='var(--color-reasoning_tokens)'
										stopOpacity={0.24}
									/>
									<stop
										offset='95%'
										stopColor='var(--color-reasoning_tokens)'
										stopOpacity={0.03}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} />
							<XAxis axisLine={false} dataKey='label' minTickGap={24} tickLine={false} />
							<YAxis
								axisLine={false}
								tickFormatter={value => `${Math.round(Number(value) / 1000)}k`}
								tickLine={false}
								width={44}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										labelFormatter={(_, payload) =>
											String(payload?.[0]?.payload?.date ?? '')
										}
									/>
								}
							/>
							<ChartLegend content={<ChartLegendContent className='pt-3' />} />
							<Area
								dataKey='input_tokens'
								fill='url(#fill-input-tokens)'
								fillOpacity={1}
								stroke='var(--color-input_tokens)'
								strokeWidth={2}
								type='monotone'
							/>
							<Area
								dataKey='output_tokens'
								fill='url(#fill-output-tokens)'
								fillOpacity={1}
								stroke='var(--color-output_tokens)'
								strokeWidth={2}
								type='monotone'
							/>
							<Area
								dataKey='reasoning_tokens'
								fill='url(#fill-reasoning-tokens)'
								fillOpacity={1}
								stroke='var(--color-reasoning_tokens)'
								strokeWidth={2}
								type='monotone'
							/>
						</AreaChart>
					</ChartContainer>
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
						<span>Workspace Activity</span>
					</div>
					<div className='text-std-400 mt-1 text-sm'>{x.activity_trend_summary}</div>
					<ChartContainer className='mt-4 h-[240px]' config={x.activity_trend_config}>
						<AreaChart data={x.trends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
							<defs>
								<linearGradient id='fill-messages' x1='0' y1='0' x2='0' y2='1'>
									<stop
										offset='5%'
										stopColor='var(--color-messages)'
										stopOpacity={0.3}
									/>
									<stop
										offset='95%'
										stopColor='var(--color-messages)'
										stopOpacity={0.04}
									/>
								</linearGradient>
								<linearGradient id='fill-new-posts' x1='0' y1='0' x2='0' y2='1'>
									<stop
										offset='5%'
										stopColor='var(--color-new_posts)'
										stopOpacity={0.28}
									/>
									<stop
										offset='95%'
										stopColor='var(--color-new_posts)'
										stopOpacity={0.03}
									/>
								</linearGradient>
								<linearGradient id='fill-new-sessions' x1='0' y1='0' x2='0' y2='1'>
									<stop
										offset='5%'
										stopColor='var(--color-new_sessions)'
										stopOpacity={0.2}
									/>
									<stop
										offset='95%'
										stopColor='var(--color-new_sessions)'
										stopOpacity={0.03}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} />
							<XAxis axisLine={false} dataKey='label' minTickGap={24} tickLine={false} />
							<YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} />
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										labelFormatter={(_, payload) =>
											String(payload?.[0]?.payload?.date ?? '')
										}
									/>
								}
							/>
							<ChartLegend content={<ChartLegendContent className='pt-3' />} />
							<Area
								dataKey='messages'
								fill='url(#fill-messages)'
								fillOpacity={1}
								stroke='var(--color-messages)'
								strokeWidth={2}
								type='monotone'
							/>
							<Area
								dataKey='new_posts'
								fill='url(#fill-new-posts)'
								fillOpacity={1}
								stroke='var(--color-new_posts)'
								strokeWidth={2}
								type='monotone'
							/>
							<Area
								dataKey='new_sessions'
								fill='url(#fill-new-sessions)'
								fillOpacity={1}
								stroke='var(--color-new_sessions)'
								strokeWidth={2}
								type='monotone'
							/>
						</AreaChart>
					</ChartContainer>
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
						<BrainCircuit className='text-rose-600' />
						<span>Rewire and Reports</span>
					</div>
					<div className='text-std-400 mt-1 text-sm'>{x.cognition_trend_summary}</div>
					<ChartContainer className='mt-4 h-[240px]' config={x.cognition_trend_config}>
						<AreaChart data={x.trends} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
							<defs>
								<linearGradient id='fill-rewire-events' x1='0' y1='0' x2='0' y2='1'>
									<stop
										offset='5%'
										stopColor='var(--color-rewire_events)'
										stopOpacity={0.28}
									/>
									<stop
										offset='95%'
										stopColor='var(--color-rewire_events)'
										stopOpacity={0.03}
									/>
								</linearGradient>
								<linearGradient id='fill-pthink-reports' x1='0' y1='0' x2='0' y2='1'>
									<stop
										offset='5%'
										stopColor='var(--color-pthink_reports)'
										stopOpacity={0.22}
									/>
									<stop
										offset='95%'
										stopColor='var(--color-pthink_reports)'
										stopOpacity={0.03}
									/>
								</linearGradient>
								<linearGradient id='fill-notifications' x1='0' y1='0' x2='0' y2='1'>
									<stop
										offset='5%'
										stopColor='var(--color-notifications)'
										stopOpacity={0.22}
									/>
									<stop
										offset='95%'
										stopColor='var(--color-notifications)'
										stopOpacity={0.03}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} />
							<XAxis axisLine={false} dataKey='label' minTickGap={24} tickLine={false} />
							<YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} />
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										labelFormatter={(_, payload) =>
											String(payload?.[0]?.payload?.date ?? '')
										}
									/>
								}
							/>
							<ChartLegend content={<ChartLegendContent className='pt-3' />} />
							<Area
								dataKey='rewire_events'
								fill='url(#fill-rewire-events)'
								fillOpacity={1}
								stroke='var(--color-rewire_events)'
								strokeWidth={2}
								type='monotone'
							/>
							<Area
								dataKey='pthink_reports'
								fill='url(#fill-pthink-reports)'
								fillOpacity={1}
								stroke='var(--color-pthink_reports)'
								strokeWidth={2}
								type='monotone'
							/>
							<Area
								dataKey='notifications'
								fill='url(#fill-notifications)'
								fillOpacity={1}
								stroke='var(--color-notifications)'
								strokeWidth={2}
								type='monotone'
							/>
						</AreaChart>
					</ChartContainer>
				</div>
			</div>
		</SectionCard>
	)
}

export default observer(Index)
