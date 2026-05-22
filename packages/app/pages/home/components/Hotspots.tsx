import { cloneElement, useRef } from 'react'
import dayjs from 'dayjs'
import { Flame } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { ActivityCalendar } from 'react-activity-calendar'

import { useSize } from '@/hooks'

import { useModel } from '../context'

import type { HomeHeatmapCell } from '../types'

const level_class_map = {
	0: 'bg-[#eef2e8] dark:bg-[#2a362b]',
	1: 'bg-[#d9e7c8] dark:bg-[#294b2f]',
	2: 'bg-[#9fd08f] dark:bg-[#3d7a45]',
	3: 'bg-[#5ea961] dark:bg-[#58a55f]',
	4: 'bg-[#2f6b3c] dark:bg-[#8be28e]'
} as const satisfies Record<number, string>

const heatmap_theme: { light: Array<string>; dark: Array<string> } = {
	light: ['#eef2e8', '#d9e7c8', '#9fd08f', '#5ea961', '#2f6b3c'],
	dark: ['#2a362b', '#294b2f', '#3d7a45', '#58a55f', '#8be28e']
}

const week_start = 1
const calendar_weeks = 52
const max_block_size = 11

const getCalendarLayout = (width?: number) => {
	const font_size = width && width < 480 ? 10 : 11
	const block_margin = width && width < 640 ? 2 : 3
	const block_size = width
		? Math.max(1, Math.min(max_block_size, Math.floor((width + block_margin) / calendar_weeks - block_margin)))
		: max_block_size
	const block_radius = Math.min(3, Math.max(1, Math.floor(block_size / 2)))

	return { block_margin, block_radius, block_size, font_size }
}

interface HeatmapActivity {
	date: string
	count: number
	level: number
	tooltip: string
	is_future?: boolean
}

const toCalendarData = (cells: Array<HomeHeatmapCell>) => {
	const today = dayjs()
	const current_week_start = today.subtract((7 + today.day() - week_start) % 7, 'day')
	const range_start = current_week_start.subtract(calendar_weeks - 1, 'week')
	const range_end = current_week_start.add(6, 'day')
	const cell_map = new Map(cells.map(item => [item.date, item] as const))

	return Array.from({ length: range_end.diff(range_start, 'day') + 1 }, (_, index) => {
		const date = range_start.add(index, 'day')
		const date_key = date.format('YYYY-MM-DD')
		const item = cell_map.get(date_key)

		if (item) {
			return {
				date: item.date,
				count: item.score,
				level: item.level,
				tooltip: item.tooltip
			} satisfies HeatmapActivity
		}

		if (date.isAfter(today, 'day')) {
			return {
				date: date_key,
				count: 0,
				level: 0,
				tooltip: `${date.format('MMM D, YYYY')} · upcoming day`,
				is_future: true
			} satisfies HeatmapActivity
		}

		return {
			date: date_key,
			count: 0,
			level: 0,
			tooltip: `${date.format('MMM D, YYYY')} · 0 hotspot score`
		} satisfies HeatmapActivity
	})
}

const Index = () => {
	const x = useModel()
	const calendar_ref = useRef<HTMLDivElement>(null)
	const calendar_width = useSize(() => calendar_ref.current!, 'width') as number | undefined
	const calendar_data = toCalendarData(x.activity_heatmap_cells)
	const { block_margin, block_radius, block_size, font_size } = getCalendarLayout(calendar_width)

	return (
		<div className='flex flex-col'>
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
			</div>
			<div
				ref={calendar_ref}
				className='
					overflow-hidden
					w-full
					min-w-0
					mt-5
					dark:[--hotspot-future-fill:#243024]
					[--hotspot-future-fill:#f6f8f1]
				'
			>
				<ActivityCalendar
					blockMargin={block_margin}
					blockRadius={block_radius}
					blockSize={block_size}
					className='text-std-400'
					data={calendar_data}
					fontSize={font_size}
					renderBlock={(block, activity) =>
						cloneElement(block, {
							fill: (activity as HeatmapActivity).is_future
								? 'var(--hotspot-future-fill)'
								: block.props.fill,
							title: (activity as HeatmapActivity).tooltip
						})
					}
					showColorLegend={false}
					showTotalCount={false}
					showWeekdayLabels={false}
					theme={heatmap_theme}
					weekStart={1}
				/>
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
	)
}

export default observer(Index)
