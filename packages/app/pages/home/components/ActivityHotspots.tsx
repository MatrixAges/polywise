import dayjs from 'dayjs'
import { Flame, MessageSquareText, Network, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import SectionCard from './SectionCard'

import type { HomeHeatmapCell } from '../types'

const level_class_map = {
	0: 'bg-[#eef2e8] dark:bg-[#1f2a1f]',
	1: 'bg-[#d9e7c8] dark:bg-[#294b2f]',
	2: 'bg-[#9fd08f] dark:bg-[#3d7a45]',
	3: 'bg-[#5ea961] dark:bg-[#58a55f]',
	4: 'bg-[#2f6b3c] dark:bg-[#8be28e]'
} as const

const week_start = 1
const weekday_labels = [
	{ row_index: 0, label: 'Mon' },
	{ row_index: 2, label: 'Wed' },
	{ row_index: 4, label: 'Fri' }
] as const

const groupByWeeks = (cells: Array<HomeHeatmapCell>) => {
	if (cells.length === 0) {
		return [] as Array<Array<HomeHeatmapCell | null>>
	}

	const first_day_index = dayjs(cells[0]!.date).day()
	const leading = (7 + first_day_index - week_start) % 7
	const padded = [
		...Array.from({ length: leading }, () => null),
		...cells,
		...Array.from({ length: (7 - ((leading + cells.length) % 7 || 7)) % 7 }, () => null)
	]

	return Array.from({ length: Math.ceil(padded.length / 7) }, (_, index) => padded.slice(index * 7, index * 7 + 7))
}

const Index = () => {
	const x = useModel()
	const weeks = groupByWeeks(x.activity_heatmap_cells)
	const month_labels = weeks.map((week, week_index) => {
		const first = week.find(Boolean)

		if (!first) {
			return { week_index, label: '' }
		}

		const label = dayjs(first.date).format('MMM')
		const previous = week_index > 0 ? weeks[week_index - 1]?.find(Boolean) : null

		return {
			week_index,
			label: previous && dayjs(previous.date).format('MMM') === label ? '' : label
		}
	})

	return (
		<SectionCard
			title='Activity Hotspots'
			desc='A GitHub-style daily map of messages, sessions, posts, rewires, and autonomous reports across the last 24 weeks.'
		>
			<div className='border-border/70 rounded-2xl border p-4'>
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
							<Flame className='text-emerald-600' />
							<span>Daily intensity</span>
						</div>
						<div className='text-std-400 mt-1 text-sm'>{x.activity_heatmap_summary}</div>
					</div>
					<div
						className='
							flex flex-wrap
							items-center
							gap-3
							text-xs text-std-400
						'
					>
						<div className='flex items-center gap-1.5'>
							<MessageSquareText className='size-3.5' />
							<span>Messages weighted with creation events</span>
						</div>
						<div className='flex items-center gap-1.5'>
							<Network className='size-3.5' />
							<span>Rewires included</span>
						</div>
						<div className='flex items-center gap-1.5'>
							<Sparkles className='size-3.5' />
							<span>PThink spikes included</span>
						</div>
					</div>
				</div>

				<div className='mt-5 overflow-x-auto pb-1'>
					<div className='min-w-max'>
						<div
							className='
								grid
								items-end
								gap-1
								text-[11px] text-std-400
							'
							style={{
								gridTemplateColumns: `32px repeat(${weeks.length}, minmax(0, 1fr))`
							}}
						>
							<div />
							{month_labels.map(item => (
								<div className='h-4' key={`month-${item.week_index}`}>
									{item.label}
								</div>
							))}
						</div>

						<div className='mt-2 flex items-start gap-2'>
							<div
								className='
									grid grid-rows-7
									gap-1
									pr-1
									text-[11px] text-std-400
								'
							>
								{Array.from({ length: 7 }, (_, row_index) => {
									const label = weekday_labels.find(
										item => item.row_index === row_index
									)

									return (
										<div
											className='flex h-3 items-center justify-end'
											key={`weekday-${row_index}`}
										>
											{label?.label ?? ''}
										</div>
									)
								})}
							</div>

							<div
								className='
									grid grid-rows-7
									auto-cols-max grid-flow-col
									gap-1
								'
								style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
							>
								{weeks.map((week, week_index) =>
									week.map((item, day_index) => (
										<div
											className={
												item
													? `
												size-3
												rounded-[3px]
												border border-black/5
												dark:border-white/6
												${level_class_map[item.level]}`
													: 'size-3 rounded-[3px] opacity-0'
											}
											key={`cell-${week_index}-${day_index}`}
											title={item?.tooltip}
										></div>
									))
								)}
							</div>
						</div>
					</div>
				</div>

				<div
					className='
						flex flex-wrap
						items-center justify-between
						gap-3
						pt-3
						mt-4
						text-xs text-std-400
						border-t border-border/60
					'
				>
					<div>Hotspot score blends messages with sessions, posts, rewires, and report bursts.</div>
					<div className='flex items-center gap-2'>
						<span>Less</span>
						{([0, 1, 2, 3, 4] as const).map(level => (
							<span
								className={`
									size-3
									rounded-[3px]
									border border-black/5
									dark:border-white/6
									${level_class_map[level]}`}
								key={`legend-${level}`}
							></span>
						))}
						<span>More</span>
					</div>
				</div>
			</div>
		</SectionCard>
	)
}

export default observer(Index)
