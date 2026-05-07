import { cloneElement } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Controller } from 'react-hook-form'

import type { ReactElement } from 'react'

interface IProps {
	type?: 'input' | 'radio' | 'checkbox' | 'switch'
	children: ReactElement
	name: string
	control: any
}

const Index = (props: IProps) => {
	const { type, children, name, control } = props

	const render = useMemoizedFn(({ field: { name, value, ref, onChange } }) => {
		const target_props = {
			name,
			value: value ?? '',
			checked: typeof value === 'boolean' ? value : false,
			ref,
			onChange
		} as any

		if (type === 'switch') {
			target_props['onCheckedChange'] = onChange
		}

		if (typeof children.type === 'function' && (children.props as any)?.items) {
			target_props['onValueChange'] = onChange
		}

		return cloneElement(children, target_props)
	})

	return <Controller name={name} control={control} render={render} />
}

export default $app.memo(Index)
