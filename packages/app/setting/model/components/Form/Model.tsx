import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TrashIcon } from '@phosphor-icons/react'
import { useMemoizedFn } from 'ahooks'

import { Controller, Switch } from '@/components'
import styles from '@/libs/Providers/index.module.css'
import { memo } from '@/utils'

import { useGlobalState } from '../../context'

import type { IPropsFormModel } from '../../types'

const Index = (props: IPropsFormModel) => {
	const { index, item, control, desc_keys, custom, editing, onChangeCurrentModel, remove } = props
	const { id, name, desc } = item

	const { locales } = useGlobalState()

	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id
	})

	const onClick = useMemoizedFn(() => onChangeCurrentModel(index))

	const target_desc = useMemo(() => {
		if (desc) return desc

		const exact_key = desc_keys.find(i => id === i)

		if (exact_key) return locales.form.desc[exact_key]

		const relate_key = desc_keys.find(i => id.toLowerCase().indexOf(i) !== -1)

		if (relate_key) return locales.form.desc[relate_key]

		return locales.form.desc.no_desc
	}, [desc, locales.form.desc, desc_keys])

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
				${custom && '!p-3'}
				${isDragging && 'z-10 rounded-sm !border backdrop-blur-sm'}
			`}
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			onClick={onClick}
			{...attributes}
			{...listeners}
		>
			<div className='flex flex-col gap-0.5'>
				<span className={`${styles.label} ${name === '' && 'text-gray'}`}>{name || 'Unnamed'}</span>
				<div className='text-softlight flex items-center text-xs'>{target_desc}</div>
			</div>
			<div className='flex items-center gap-3'>
				{editing && (
					<button className='btn rounded-2xl p-1.5' type='button' onClick={onRemove}>
						<TrashIcon className='text-base' />
					</button>
				)}
				<Controller name={`models.${index}.enabled`} control={control}>
					<Switch />
				</Controller>
			</div>
		</div>
	)
}

export default memo(Index)
