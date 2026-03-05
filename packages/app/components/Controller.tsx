import { cloneElement } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Controller } from 'react-hook-form'

import type { ReactElement } from 'react'
import type { Control } from 'react-hook-form'

interface IProps {
	children: ReactElement
	name: string
	control: Control<any>
}

const Index = (props: IProps) => {
	const { children, name, control } = props

	const render = useMemoizedFn(({ field: { name, value, ref, onChange } }) =>
		cloneElement(children, {
			//@ts-ignore
			name,
			value,
			checked: typeof value === 'boolean' ? value : undefined,
			onCheckedChange: onChange,
			ref,
			onChange
		})
	)

	return <Controller name={name} control={control} render={render} />
}

export default $app.memo(Index)
