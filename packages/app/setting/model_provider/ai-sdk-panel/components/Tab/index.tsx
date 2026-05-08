import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Download, Plus, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger
} from '@/__shadcn__/components/ui/select'

import Item from './Item'

import type { IPropsTab } from '../../types'

const Index = (props: IPropsTab) => {
	const {
		items,
		currentTab,
		builtinProviders,
		onChangeCurrentTab,
		onDragProvider,
		onAddBuiltinProvider,
		download,
		upload
	} = props
	const { t } = useTranslation()

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	return (
		<div
			className='
				flex flex-col
				w-[160px] h-full
				pr-2.5
			'
		>
			<div
				className='
					overflow-y-scroll
					flex-1
					w-full
					pt-2.5
					pb-6
				'
			>
				<div
					className='
						flex flex-col
						w-full
						gap-1
					'
				>
					<DndContext sensors={sensors} onDragEnd={onDragProvider}>
						<SortableContext items={items} strategy={verticalListSortingStrategy}>
							{items.map((item, index) => (
								<Item
									index={index}
									displayName={t(`provider.providers.${item}` as any)}
									active={currentTab === index}
									key={item}
									{...{ item, onChangeCurrentTab }}
								/>
							))}
						</SortableContext>
					</DndContext>
				</div>
			</div>
			<div className='flex flex-col py-2.5'>
				<Select
					items={builtinProviders.map((item, index) => ({ label: item.name, value: index }))}
					value={-1}
					onValueChange={onAddBuiltinProvider}
				>
					<SelectTrigger noStyle>
						<div className='click_button'>
							<Plus></Plus>
							<span>Add Provider</span>
						</div>
					</SelectTrigger>
					<SelectContent className='max-h-60 w-[180px]' align='start'>
						<SelectGroup>
							<SelectLabel>Builtin Providers</SelectLabel>
							{builtinProviders.map((item, index) => (
								<SelectItem value={index} key={item.name}>
									{t(`provider.providers.${item.name}` as any)}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<div className='click_button' onClick={download}>
					<Download></Download>
					<span>Export Config</span>
				</div>
				<div className='click_button' onClick={upload}>
					<Upload></Upload>
					<span>Import Config</span>
				</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)
