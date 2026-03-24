import { useEffect, useMemo, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import {
	Combobox,
	ComboboxCollection,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxLabel,
	ComboboxList,
	ComboboxSeparator
} from '@/__shadcn__/components/ui/combobox'
import { useGlobal } from '@/context'

import type { DefaultModel } from '@core/types'

interface IProps {
	value: DefaultModel
	onChange: (v: DefaultModel) => void
}

const Index = (props: IProps) => {
	const { value, onChange } = props

	const global = useGlobal()

	const s = global.setting
	const providers = $copy([...s.providers.providers, ...(s.providers.custom_providers || [])])

	const [model, setModel] = useState<string | null>(null)

	useEffect(() => {
		if (value?.model) setModel(value.model)
	}, [value])

	const setDefaultModel = useMemoizedFn((_, detail) => {
		const index = Number(detail.event.target.dataset.index)
		const idx = Number(detail.event.target.dataset.idx)
		const provider = providers[index]
		const model = provider.models![idx].id

		setModel(model)
		onChange({ provider: provider.name, model })
	})

	const provider_items = useMemo(
		() =>
			providers.map(group => ({
				value: group.name,
				items: (group.models || []).map(item => item.id)
			})),
		[providers]
	)

	return (
		<Combobox items={provider_items} value={model} onValueChange={setDefaultModel}>
			<ComboboxInput placeholder='Select a default model' />
			<ComboboxContent>
				<ComboboxEmpty>No providers found.</ComboboxEmpty>
				<ComboboxList>
					{(group, index) => (
						<ComboboxGroup key={group.value} items={group.items}>
							<ComboboxLabel>{group.value}</ComboboxLabel>
							<ComboboxCollection>
								{(item, idx) => (
									<ComboboxItem
										data-index={index}
										data-idx={idx}
										value={item}
										key={item}
									>
										{item}
									</ComboboxItem>
								)}
							</ComboboxCollection>
							{index < provider_items.length - 1 && <ComboboxSeparator />}
						</ComboboxGroup>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
