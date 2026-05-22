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

interface HeatmapSlot {
	cell: HomeHeatmapCell | null
	date: string
	is_future: boolean
}

const groupByWeeks = (cells: Array<HomeHeatmapCell>) => {
	if (cells.length === 0) {
		return [] as Array<Array<HeatmapSlot>>
	}

	const first_date = dayjs(cells[0]!.date)
	const last_date = dayjs(cells[cells.length - 1]!.date)
	const first_day_index = first_date.day()
	const leading = (7 + first_day_index - week_start) % 7
	const trailing = (7 - ((leading + cells.length) % 7 || 7)) % 7
	const start_date = first_date.subtract(leading, 'day')
	const total_slots = leading + cells.length + trailing

	return Array.from({ length: Math.ceil(total_slots / 7) }, (_, week_index) =>
		Array.from({ length: 7 }, (_, day_index) => {
			const offset = week_index * 7 + day_index
			const date = start_date.add(offset, 'day')
			const cell_index = offset - leading
			const cell = cell_index >= 0 && cell_index < cells.length ? cells[cell_index]! : null

			return {
				cell,
				date: date.format('YYYY-MM-DD'),
				is_future: date.isAfter(last_date, 'day')
			}
		})
	)
}

const Index = () => {
	const x = useModel()
	const weeks = groupByWeeks(x.activity_heatmap_cells)
	const month_labels = weeks.map((week, week_index) => {
		const first = week.find(item => item.cell)?.cell

		if (!first) {
			return { week_index, label: '' }
		}

		const label = dayjs(first.date).format('MMM')
		const previous = week_index > 0 ? weeks[week_index - 1]?.find(item => item.cell)?.cell : null

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

				<div className='mt-5 min-w-0'>
					<div
						className='
							grid
							items-end
							gap-x-2 gap-y-2
						'
						style={{ gridTemplateColumns: '40px minmax(0, 1fr)' }}
					>
						<div />
						<div
							className='
								relative
								h-4
								min-w-0
								text-[11px] text-std-400
							'
						>
							{month_labels.map(item =>
								item.label ? (
									<div
										className='absolute top-0 whitespace-nowrap'
										key={`month-${item.week_index}`}
										style={{
											left: `calc(${(item.week_index / weeks.length) * 100}% + 1px)`
										}}
									>
										{item.label}
									</div>
								) : null
							)}
						</div>

						<div
							className='
								grid
								h-full
								gap-1
								text-[11px] text-std-400
							'
							style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
						>
							{Array.from({ length: 7 }, (_, row_index) => {
								const label = weekday_labels.find(item => item.row_index === row_index)

								return (
									<div
										className='
										flex
										items-center justify-end
										h-full
										pr-1
										whitespace-nowrap
									'
										key={`weekday-${row_index}`}
									>
										{label?.label ?? ''}
									</div>
								)
							})}
						</div>

						<div
							className='grid min-w-0 gap-1'
							style={{
								gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
								gridTemplateRows: 'repeat(7, minmax(0, 1fr))'
							}}
						>
							{weeks.map((week, week_index) =>
								week.map((item, day_index) => (
									<div
										className={
											item.cell
												? `
											aspect-square
											w-full
											rounded-[3px]
											border border-black/5
											dark:border-white/6
											${level_class_map[item.cell.level]}`
												: item.is_future
													? `
											aspect-square
											w-full
											rounded-[3px]
											bg-[#f6f8f1]
											border border-black/5
											dark:border-white/6 dark:bg-[#182118]
										`
													: 'aspect-square w-full rounded-[3px] opacity-0'
										}
										key={`cell-${week_index}-${day_index}`}
										title={
											item.cell?.tooltip ??
											(item.is_future
												? `${dayjs(item.date).format('MMM D, YYYY')} · upcoming day`
												: undefined)
										}
									></div>
								))
							)}
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
