import { useLayoutEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { deepEqual } from 'stk/react'
import { container } from 'tsyringe'

import { CodingPlan, Custom, Disabled, Form, Tab } from './components'
import Model from './model'

import type { IPropsCustom, IPropsDisabled, IPropsForm, IPropsPanel, IPropsTab } from './types'

const Index = (props: IPropsPanel) => {
	const { config, onChange, onTest } = props
	const [x] = useState(() => container.resolve(Model))

	const target_config = $copy(x.config)
	const providers = $copy(x.providers)

	useLayoutEffect(() => {
		if (deepEqual(config, x.config)) return

		x.init({ config, onChange, onTest })
	}, [config, onChange, onTest])

	const props_tab: IPropsTab = {
		items: $copy(x.tabs),
		current_tab: x.current_tab,
		builtin_providers: $copy(x.builtin_providers),
		onChangeCurrentTab: x.onChangeCurrentTab,
		onDragProvider: x.onDragProvider,
		onAddBuiltinProvider: x.onAddBuiltinProvider,
		download: x.download,
		upload: x.upload
	}

	const props_form: IPropsForm = {
		all_providers: x.all_providers,
		provider: $copy(x.provider),
		test: $copy(x.test),
		current_model: x.current_model,
		adding_model: x.adding_model,
		onTest: x.onTestModel,
		onChangeProvider: x.onChangeProvider,

		onChangeCurrentModel: useMemoizedFn((v: number | null) => {
			x.current_model = v === x.current_model ? null : v
		}),
		toggleAddingModel: useMemoizedFn(() => (x.adding_model = !x.adding_model)),
		onDisableProvider: x.onToggleProvider
	}

	const props_custom: IPropsCustom = {
		custom_providers: $copy(target_config?.custom_providers),
		onChangeCustomProviders: x.onChangeCustomProviders
	}

	const props_disabled: IPropsDisabled = {
		items: providers.disabled,
		onEnableProvider: x.onEnableProvider
	}

	if (!x.config || !target_config) return null

	return (
		<div
			className='
				flex
				w-full h-full
			'
		>
			<Tab {...props_tab} />
			<div
				className='
					overflow-y-scroll
					flex flex-1
					w-full h-full
					page_wrap
				'
			>
				<div
					className='
						flex flex-col
						w-full
						gap-6
					'
				>
					{x.current_tab === props_tab.items.length - 1 ? (
						<Disabled {...props_disabled} />
					) : x.current_tab === props_tab.items.length - 2 ? (
						<Custom {...props_custom} />
					) : (
						<Form {...props_form} />
					)}
					<CodingPlan></CodingPlan>
				</div>
			</div>
		</div>
	)
}
export default new $app.Handle(Index).by(observer).by($app.memo).get()
