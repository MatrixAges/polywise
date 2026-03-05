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

	const render = useMemoizedFn(({ field: { value, name, ref, onChange } }) =>
		//@ts-ignore
		cloneElement(children, { name, value, ref, onChange })
	)

	return <Controller name={name} control={control} render={render} />
}

export default $app.memo(Index)
