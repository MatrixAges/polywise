import { useMemo } from 'react'
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
import { local_models } from '@/appdata'
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
	model: { id: local_models.gen.model, name: local_models.gen.name, enabled: true, type: 'text' },
	value: getModelValue('local model', local_models.gen.model),
	label: local_models.gen.name
})

const Index = (props: IProps) => {
	const { value, show_local_model, filter_type, ghost, onChange } = props

	const global = useGlobal()

	const s = global.setting
	const config = $copy(s.config)
	const providers = $copy([...s.providers.providers, ...(s.providers.custom_providers || [])])

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
				value: 'Local Models',
				items: [getLocalModelItem()]
			})
		}

		return target
	}, [providers, show_local_model, filter_type])

	const all_items = useMemo(() => provider_items.flatMap(group => group.items), [provider_items])

	const item_lookup = useMemo(() => {
		return all_items.reduce<Record<string, IModelItem>>((target, item) => {
			target[item.value] = item

			return target
		}, {})
	}, [all_items])

	const selected_value = useMemo(() => {
		if (!value || typeof value !== 'object') return null

		return getModelValue(value.provider, value.model)
	}, [value])

	const selected_item = useMemo(
		() => all_items.find(item => item.value === selected_value) || null,
		[all_items, selected_value]
	)

	const setDefaultModel = useMemoizedFn((next_value: IModelItem | null) => {
		if (!next_value) return

		const target = item_lookup[next_value.value]

		if (!target) return

		onChange?.({ provider: target.provider, model: target.model.id })
	})

	return (
		<Combobox
			items={provider_items}
			value={selected_item}
			onValueChange={setDefaultModel}
			isItemEqualToValue={(item_value, value) => item_value.value === value.value}
		>
			<ComboboxInput ghost={ghost} placeholder='Select a default model' />
			<ComboboxContent ghost={ghost}>
				<ComboboxEmpty>No providers found.</ComboboxEmpty>
				<ComboboxList>
					{(group, index) => (
						<ComboboxGroup key={group.value} items={group.items}>
							<ComboboxLabel>{group.value}</ComboboxLabel>
							<ComboboxCollection>
								{item => (
									<ComboboxItem value={item} key={item.value}>
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
