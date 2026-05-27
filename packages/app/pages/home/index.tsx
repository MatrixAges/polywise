import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { Button } from '@/__shadcn__/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import { Fallback, TextTabs } from '@/components'

import {
	Agent,
	ContentReview,
	Hotspots,
	Memory,
	Overview,
	Pipeline,
	Report,
	SessionActivity,
	TokenUsage,
	Trending
} from './components'
import { Context } from './context'
import Model, { home_report_period_items, home_stats_period_items } from './model'

import type { HomeReportPeriod, HomeStatsPeriod } from './types'

type TopTabKey = 'stats' | 'agent' | 'memory' | 'report'

const top_tab_items: Array<{ key: TopTabKey; title: string }> = [
	{ key: 'stats', title: 'Stats' },
	{ key: 'agent', title: 'Agent' },
	{ key: 'memory', title: 'Memory' },
	{ key: 'report', title: 'Report' }
]

const Index = () => {
	const ref_model = useRef<Model | null>(null)
	const [active_tab, setActiveTab] = useState<TopTabKey>('stats')

	if (!ref_model.current) {
		ref_model.current = container.resolve(Model)
	}

	const x = ref_model.current
	const period_items = active_tab === 'report' ? home_report_period_items : home_stats_period_items
	const period_value = active_tab === 'report' ? x.report_period : x.stats_period

	useEffect(() => {
		void x.init()

		return () => x.deinit()
	}, [x])

	return (
		<Context value={x}>
			<div className='page_wrap flex flex-col pb-10'>
				<div
					className='
						flex
						items-center justify-between
						h-7
						gap-4
						mb-6
					'
				>
					<TextTabs
						className='gap-3'
						items={top_tab_items}
						active={active_tab}
						setActive={value => setActiveTab(value as TopTabKey)}
					></TextTabs>
					<div className='flex items-center gap-2'>
						<Select
							onValueChange={value => {
								if (!value) {
									return
								}

								if (active_tab === 'report') {
									x.setReportPeriod(value as HomeReportPeriod)
									return
								}

								x.setStatsPeriod(value as HomeStatsPeriod)
							}}
							value={period_value}
						>
							<SelectTrigger
								className='
									h-auto
									px-0 py-0
									rounded-none
									text-sm text-std-400
									bg-transparent
									border-0
									shadow-none
									hover:bg-transparent
									focus-visible:ring-0
								'
								arrowClassName='size-3.5 text-std-400'
								noActiveStyle
							>
								<SelectValue className='text-std-400 text-sm' />
							</SelectTrigger>
							<SelectContent align='end'>
								{period_items.map(item => (
									<SelectItem key={item.value} value={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{active_tab === 'report' && (
							<>
								<button
									className={$cx(
										'icon_button small',
										!x.can_move_to_prev_report_window && 'opacity-40'
									)}
									disabled={!x.can_move_to_prev_report_window}
									type='button'
									onClick={x.moveToPrevReportWindow}
								>
									<ChevronLeft className='size-3.5'></ChevronLeft>
								</button>
								<button
									className={$cx(
										'icon_button small',
										!x.can_move_to_next_report_window && 'opacity-40'
									)}
									disabled={!x.can_move_to_next_report_window}
									type='button'
									onClick={x.moveToNextReportWindow}
								>
									<ChevronRight className='size-3.5'></ChevronRight>
								</button>
								<Button
									variant='default'
									size='xs'
									disabled={!x.report_enabled || x.report_action_loading}
									onClick={() => void x.triggerReport()}
								>
									{x.report_action_loading ? (
										<Loader2 className='size-2.5 animate-spin'></Loader2>
									) : (
										<FileText className='size-2.5'></FileText>
									)}
									<span>{x.report_action_label}</span>
								</Button>
							</>
						)}
					</div>
				</div>
				<div className='min-h-0 flex-1 overflow-y-auto'>
					<div
						className='
							flex flex-col
							w-full
							min-h-full
						'
					>
						{x.snapshot ? (
							<>
								{active_tab === 'stats' && (
									<div className='flex flex-col gap-10'>
										<Hotspots></Hotspots>
										<Overview></Overview>
										<TokenUsage></TokenUsage>
										<Trending></Trending>
										<SessionActivity></SessionActivity>
										<ContentReview></ContentReview>
										<Pipeline></Pipeline>
									</div>
								)}
								{active_tab === 'agent' && (
									<div className='flex flex-col gap-10'>
										<Agent></Agent>
									</div>
								)}
								{active_tab === 'memory' && (
									<div className='flex flex-col gap-10'>
										<Memory></Memory>
									</div>
								)}
								{active_tab === 'report' && (
									<div className='flex flex-col gap-10'>
										<Report></Report>
									</div>
								)}
							</>
						) : (
							<Fallback></Fallback>
						)}
					</div>
				</div>
			</div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
