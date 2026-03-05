import { useLayoutEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { deepEqual } from 'stk/react'
import { container } from 'tsyringe'

import { Custom, Disabled, Form, Tab } from './components'
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
		onChangeCurrentTab: x.onChangeCurrentTab,
		onDragProvider: x.onDragProvider
	}

	const props_form: IPropsForm = {
		provider: $copy(x.provider),
		test: $copy(x.test),
		current_model: x.current_model,
		adding_model: x.adding_model,
		onTest: x.onTestModel,
		onChangeProvider: x.onChangeProvider,
		download: x.download,
		upload: x.upload,
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
				w-full h-full max-w-[800px]!
				px-4!
				pb-0!
				page_wrap
			'
		>
			<Tab {...props_tab} />
			<div
				className='
					overflow-y-scroll
					flex flex-1
					w-full h-full
					px-2
					pl-4
				'
			>
				{x.current_tab === props_tab.items.length - 1 ? (
					<Disabled {...props_disabled} />
				) : x.current_tab === props_tab.items.length - 2 ? (
					<Custom {...props_custom} />
				) : (
					<Form {...props_form} />
				)}
			</div>
		</div>
	)
}
export default new $app.Handle(Index).by(observer).by($app.memo).get()
