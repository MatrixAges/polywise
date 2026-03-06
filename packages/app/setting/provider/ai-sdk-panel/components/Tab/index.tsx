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
		current_tab,
		builtin_providers,
		onChangeCurrentTab,
		onDragProvider,
		onAddBuiltinProvider,
		download,
		upload
	} = props
	const { t } = useTranslation()

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	return (
		<div className='flex h-full w-[160px] flex-col'>
			<div className='w-full flex-1 overflow-y-scroll py-6'>
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
			<div className='flex flex-col py-2'>
				<Select
					items={builtin_providers.map((item, index) => ({ label: item.name, value: index }))}
					value={-1}
					onValueChange={onAddBuiltinProvider}
				>
					<SelectTrigger no_style>
						<div className='click_button'>
							<Plus></Plus>
							<span>Add Provider</span>
						</div>
					</SelectTrigger>
					<SelectContent className='max-h-60 w-[180px]' align='start'>
						<SelectGroup>
							<SelectLabel>Builtin Providers</SelectLabel>
							{builtin_providers.map((item, index) => (
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
