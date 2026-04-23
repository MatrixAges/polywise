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

import type { DefaultModel, Model } from '@core/types'

interface IProps {
	value?: DefaultModel
	show_local_model?: boolean
	filter_type?: string
	ghost?: boolean
	onChange?: (v: DefaultModel) => void
}

interface IModelItem {
	provider: string
	model: Model
	value: string
	label: string
}

interface IProviderGroup {
	value: string
	items: Array<IModelItem>
}

const getModelValue = (provider: string, model: string) => `${provider}::${model}`

const getLocalModelItem = (): IModelItem => ({
	provider: 'local model',
	model: { id: 'qwen3.5-4b', name: 'qwen3.5-4b', enabled: true, type: 'text' },
	value: getModelValue('local model', 'qwen3.5-4b'),
	label: 'qwen3.5-4b'
})

const Index = (props: IProps) => {
	const { value, show_local_model, filter_type, ghost, onChange } = props

	const global = useGlobal()

	const s = global.setting
	const config = $copy(s.config)
	const providers = $copy([...s.providers.providers, ...(s.providers.custom_providers || [])])

	const [model, setModel] = useState<string | null>(() =>
		config?.default_model ? getModelValue(config.default_model.provider, config.default_model.model) : null
	)

	useEffect(() => {
		if (config?.default_model)
			setModel(getModelValue(config.default_model.provider, config.default_model.model))
	}, [config?.default_model])

	useEffect(() => {
		if (value) setModel(getModelValue(value.provider, value.model))
	}, [value])

	const provider_items = useMemo(() => {
		const target: Array<IProviderGroup> = []

		providers.forEach(group => {
			if (!group.enabled) return

			const filtered_models = (group.models || []).filter(item => {
				if (!item.enabled) return false
				if (filter_type) return (item.type || 'text') === filter_type
				return true
			})

			if (filtered_models.length === 0) return

			target.push({
				value: group.name,
				items: filtered_models.map(item => ({
					provider: group.name,
					model: item,
					value: getModelValue(group.name, item.id),
					label: item.name
				}))
			})
		})

		if (show_local_model && (!filter_type || filter_type === 'text')) {
			target.unshift({
				value: 'local model',
				items: [getLocalModelItem()]
			})
		}

		return target
	}, [providers, show_local_model, filter_type])

	const setDefaultModel = useMemoizedFn((next_value: string) => {
		const target = provider_items.flatMap(group => group.items).find(item => item.value === next_value)

		if (!target) return

		setModel(target.value)
		onChange?.({ provider: target.provider, model: target.model.id })
	})

	return (
		<Combobox items={provider_items} value={model} onValueChange={setDefaultModel}>
			<ComboboxInput ghost={ghost} placeholder='Select a default model' />
			<ComboboxContent ghost={ghost}>
				<ComboboxEmpty>No providers found.</ComboboxEmpty>
				<ComboboxList>
					{(group, index) => (
						<ComboboxGroup key={group.value} items={group.items}>
							<ComboboxLabel>{group.value}</ComboboxLabel>
							<ComboboxCollection>
								{item => (
									<ComboboxItem value={item.value} key={item.value}>
										{item.label}
									</ComboboxItem>
								)}
							</ComboboxCollection>
							{index < provider_items.length - 2 && <ComboboxSeparator />}
						</ComboboxGroup>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
