import { useEffect } from 'react'
import { useMemoizedFn } from 'ahooks'
import { useForm } from 'react-hook-form'
import { deepEqual } from 'stk/react'

import type { FieldValues, UseFormProps } from 'react-hook-form'

export type OnChangeHandler<T> = (values: T, changed?: Partial<T>) => void

export default <T extends FieldValues = FieldValues>(props: UseFormProps<T>, onChange: OnChangeHandler<T>) => {
	const res = useForm<T>(props)

	const { watch, getValues } = res

	const onChangeValues = useMemoizedFn((values, { name }) => {
		if (deepEqual(values[name], props.values?.[name])) return

		const changed_value = getValues(name)

		onChange(values as T, { [name]: changed_value } as Partial<T>)
	})

	useEffect(() => {
		const subscription = watch(onChangeValues)

		return () => subscription.unsubscribe()
	}, [watch, onChangeValues])

	return res
}
