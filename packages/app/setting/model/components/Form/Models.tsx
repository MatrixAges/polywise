import { Fragment, useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemoizedFn } from 'ahooks'

import { Show } from '@/components'
import { memo } from '@/utils'

import { useGlobalState } from '../../context'
import Model from './Model'
import ModelForm from './ModelForm'

import type { IPropsFormModels } from '../../types'

const Index = (props: IPropsFormModels) => {
	const { models, control, current_model, custom, register, remove, onChangeCurrentModel, onDragModel } = props

	const { locales } = useGlobalState()

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	const desc_keys = useMemo(() => Object.keys(locales.form.desc), [locales.form.desc])

	const onDragStart = useMemoizedFn(() => onChangeCurrentModel(null))

	if (!models?.length)
		return (
			<div
				className='
				flex
				justify-center
				px-4 py-5
				rounded-2xl
				text-xsm text-soft
				bg-bg-main
				border border-border-gray
			'
			>
				{locales.form.models_empty}
			</div>
		)

	return (
		<div
			className='
				overflow-hidden
				flex flex-col
				rounded-2xl
				border border-border-gray
			'
		>
			<DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragModel}>
				<SortableContext items={models} strategy={verticalListSortingStrategy}>
					{models.map((item, index) => (
						<Fragment key={item.id}>
							<Model
								editing={current_model === index}
								{...{
									index,
									item,
									control,
									desc_keys,
									custom,
									onChangeCurrentModel,
									remove
								}}
							/>
							<Show
								className='overflow-hidden'
								visible={current_model !== null && current_model === index}
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
							>
								<ModelForm {...{ item, index, control, register }} />
							</Show>
						</Fragment>
					))}
				</SortableContext>
			</DndContext>
		</div>
	)
}

export default memo(Index)
