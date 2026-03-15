import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoizedFn } from 'ahooks'

import { ProviderIcon } from '@/components'
import { useDelayValue, useScrollToItem } from '@/hooks'

import type { IPropsTabItem } from '../../types'

const Index = (props: IPropsTabItem) => {
	const { index, item, display_name, active, onChangeCurrentTab } = props

	const disabled = useMemo(() => item === 'custom' || item === 'disabled', [item])

	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: item,
		disabled
	})

	const is_dragging = useDelayValue(isDragging, 300) || isDragging

	useScrollToItem(item, active, isDragging)

	const onClick = useMemoizedFn(() => onChangeCurrentTab(index))

	return (
		<div
			className={$cx(
				`
				flex
				items-center
				h-8
				gap-2.5
				px-2.5
				text-light
				click_button
			`,
				is_dragging && disabled && 'cursor-not-allowed!',
				is_dragging && 'relative z-10 cursor-grab transition-none!',
				active && 'active'
			)}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			ref={setNodeRef}
			onClick={onClick}
			{...attributes}
			{...listeners}
		>
			<ProviderIcon name={item} />
			<span>{display_name}</span>
		</div>
	)
}

export default Index
