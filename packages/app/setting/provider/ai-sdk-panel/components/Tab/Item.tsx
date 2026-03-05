import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoizedFn } from 'ahooks'

import { ProviderIcon } from '@/components'
import { useScrollToItem } from '@/hooks'

import type { IPropsTabItem } from '../../types'

const Index = (props: IPropsTabItem) => {
	const { index, item, display_name, active, onChangeCurrentTab } = props

	const disabled = item === 'custom' || item === 'disabled'

	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: item,
		disabled
	})

	useScrollToItem(item, active, isDragging)

	const onClick = useMemoizedFn(() => onChangeCurrentTab(index))

	return (
		<div
			className={`
				flex
				items-center
				h-8
				gap-2.5
				px-2.5
				text-light
				click_button
				${isDragging && disabled && 'cursor-not-allowed!'}
				${isDragging && 'cursor-grab transition-none!'}
                        ${active && 'active'}
			`}
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
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
