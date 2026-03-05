import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslation } from 'react-i18next'

import Item from './Item'

import type { IPropsTab } from '../../types'

const Index = (props: IPropsTab) => {
	const { items, current_tab, onChangeCurrentTab, onDragProvider } = props
	const { t } = useTranslation()

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	return (
		<div className='h-full w-full overflow-y-scroll'>
			<div className='flex w-full flex-col'>
				<DndContext sensors={sensors} onDragEnd={onDragProvider}>
					<SortableContext items={items} strategy={verticalListSortingStrategy}>
						{items.map((item, index) => (
							<Item
								index={index}
								display_name={t(`provider.providers.${item}` as any)}
								active={current_tab === index}
								key={item}
								{...{ item, onChangeCurrentTab }}
							/>
						))}
					</SortableContext>
				</DndContext>
			</div>
		</div>
	)
}

export default $app.memo(Index)
