import { useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { ScrollMenu } from 'react-horizontal-scrolling-menu'

import { memo } from '@/utils'

import { useGlobalState } from '../../context'
import Item from './Item'

import type { IPropsTab, ProvidersLocales } from '../../types'

const Index = (props: IPropsTab) => {
	const { tab, items, current_tab, onChangeCurrentTab, onDragProvider } = props

	const { locales } = useGlobalState()

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	const { scroller, container } = useMemo(() => {
		const styles = { scroller: '', container: '' }

		styles['scroller'] += ' max-w-full'

		if (tab === 'scroll') {
			styles['scroller'] += ' overflow-scroll no-scrollbar'
		} else {
			styles['container'] += ' w-full justify-between'
		}

		return styles
	}, [tab])

	const Items = (
		<DndContext sensors={sensors} onDragEnd={onDragProvider}>
			<SortableContext items={items} strategy={horizontalListSortingStrategy}>
				{items.map((item, index) => (
					<Item
						index={index}
						display_name={locales.providers[item as keyof ProvidersLocales['providers']]}
						active={current_tab === index}
						key={item}
						{...{ item, onChangeCurrentTab }}
					/>
				))}
			</SortableContext>
		</DndContext>
	)

	return (
		<div className={`flex w-full${scroller}`}>
			<div className={`flex${container}`}>
				{tab === 'scroll' ? (
					<ScrollMenu wrapperClassName='w-full' itemClassName='flex gap-10'>
						{Items}
					</ScrollMenu>
				) : (
					Items
				)}
			</div>
		</div>
	)
}

export default memo(Index)
