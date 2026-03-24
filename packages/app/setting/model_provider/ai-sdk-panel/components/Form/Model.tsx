import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoizedFn } from 'ahooks'
import { Trash } from 'lucide-react'

import { Switch } from '@/__shadcn__/components/ui/switch'
import { Controller } from '@/components'

import styles from '../../index.module.css'

import type { Control } from 'react-hook-form'
import type { IPropsFormModel } from '../../types'

const Index = (props: IPropsFormModel) => {
	const { index, item, control, custom, editing, onChangeCurrentModel, remove } = props
	const { id, name } = item

	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id
	})

	const onClick = useMemoizedFn(() => onChangeCurrentModel(index))
	const onRemove = useMemoizedFn(() => remove(index))

	return (
		<div
			className={$cx(
				`
				h-13
				border-border-light/80 border-b
				transition-colors
				hover:bg-bg-main-hover active:bg-bg-main-active
				select-none cursor-pointer nth-last-of-type-3:border-none
			`,
				isDragging && 'z-10 rounded-full border backdrop-blur-sm'
			)}
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			onClick={onClick}
			{...attributes}
			{...listeners}
		>
			<div
				className={$cx(
					`
					flex
					items-center justify-between
					w-full h-full
					gap-3
					px-4
				`,
					custom && 'p-3!'
				)}
			>
				<span className={$cx(styles.label, name === '' && 'text-gray')}>{name || 'Unnamed'}</span>
				<div className='flex items-center gap-3'>
					{editing && (
						<button className='btn rounded-2xl p-1.5' type='button' onClick={onRemove}>
							<Trash className='text-base' size={14} />
						</button>
					)}
					<Controller name={`models.${index}.enabled`} control={control}>
						<Switch />
					</Controller>
				</div>
			</div>
		</div>
	)
}

export default $app.memo(Index)
