import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'

import Form from '../Form'

import type { IPropsCustomProvider, IPropsForm, Provider } from '../../types'

const Index = (props: IPropsCustomProvider) => {
	const { index, item, update, remove } = props
	const [currentModel, setCurrentModel] = useState<number | null>(null)
	const [addingModel, setAddingModel] = useState(false)

	const onChangeProvider = useMemoizedFn((v: Provider) => update(index, v))

	const props_form: IPropsForm = {
		provider: item,
		currentModel,
		addingModel,
		custom: true,
		onChangeProvider,
		onChangeCurrentModel: useMemoizedFn((v: number | null) => {
			setCurrentModel(v === currentModel ? null : v)
		}),
		toggleAddingModel: useMemoizedFn(() => setAddingModel(!addingModel)),
		onRemoveProvider: useMemoizedFn(() => remove(index))
	}

	return (
		<div
			className='
				flex flex-col
				gap-5
				p-4 pt-2
				rounded-4xl
				border border-dashed border-border-light
			'
		>
			<Form {...props_form} />
		</div>
	)
}

export default $app.memo(Index)
