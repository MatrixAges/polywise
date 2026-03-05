import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemoizedFn } from 'ahooks'
import { Trash } from 'lucide-react'

import { Switch } from '@/__shadcn__/components/ui/switch'
import { Controller } from '@/components'

import styles from '../../index.module.css'

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
			className={`
				flex
				items-center justify-between
				gap-3
				p-4
				bg-bg-main
				border-b border-border-light
				transition-colors
				hover:bg-bg-main-hover active:bg-bg-main-active
				select-none cursor-pointer nth-last-of-type-3:border-none
				${custom && 'p-3!'}
				${isDragging && 'z-10 rounded-sm border backdrop-blur-sm'}
			`}
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			onClick={onClick}
			{...attributes}
			{...listeners}
		>
			<div className='flex flex-col gap-0.5'>
				<span className={`${styles.label} ${name === '' && 'text-gray'}`}>{name || 'Unnamed'}</span>
				<div className='text-softlight flex items-center text-xs'></div>
			</div>
			<div className='flex items-center gap-3'>
				{editing && (
					<button className='btn rounded-2xl p-1.5' type='button' onClick={onRemove}>
						<Trash className='text-base' />
					</button>
				)}
				<Controller name={`models.${index}.enabled`} control={control}>
					<Switch />
				</Controller>
			</div>
		</div>
	)
}

export default $app.memo(Index)
