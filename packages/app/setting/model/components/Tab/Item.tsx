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
				flex flex-col
				items-center
				gap-3
				text-light
				group
				hover:text-gray-600
				data-[active=true]:!text-dark
				${isDragging && disabled && '!cursor-not-allowed'}
				${isDragging ? 'cursor-grab' : 'clickable'}
			`}
			ref={setNodeRef}
			data-active={active}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			onClick={onClick}
			{...attributes}
			{...listeners}
		>
			<span className='flex items-center justify-center text-xl'>
				<ProviderIcon name={item} />
			</span>
			<span
				className='
					text-xsm text-soft
					group-data-[active=true]:!text-dark
				'
			>
				{display_name}
			</span>
		</div>
	)
}

export default Index
