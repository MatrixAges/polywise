import 'react-horizontal-scrolling-menu/dist/styles.css'

import { useLayoutEffect, useRef } from 'react'
import { useMemoizedFn } from 'ahooks'
import { deepmerge } from 'deepmerge-ts'
import { deepEqual } from 'fast-equals'
import { proxy } from 'valtio'
import { deepClone, useProxy } from 'valtio/utils'

import { AnimateBox, Show } from '@/components'
import { providers_locales } from '@/i18n'
import { memo } from '@/utils'

import { Custom, Disabled, Form, Tab } from './components'
import { GlobalState } from './context'
import Model from './model'

import type {
	DeepRequired,
	IPropsCustom,
	IPropsDisabled,
	IPropsForm,
	IPropsProviders,
	IPropsTab,
	ProvidersLocales
} from './types'

const Index = (props: IPropsProviders) => {
	const { config, tab, width, locales, icons, onChange, onTest } = props
	const state = useRef(proxy(new Model()))
	const x = useProxy(state.current)

	const target_config = deepClone(x.config)
	const providers = deepClone(x.providers)
	const target_locales = deepmerge(providers_locales, locales) as DeepRequired<ProvidersLocales>
	const locales_upload = target_locales['upload']!

	useLayoutEffect(() => {
		if (deepEqual(config, x.config)) return

		x.init({ locales_upload, config, onChange, onTest })
	}, [locales_upload, config, onChange, onTest])

	const props_tab: IPropsTab = {
		tab,
		items: deepClone(x.tabs),
		current_tab: x.current_tab,
		onChangeCurrentTab: x.onChangeCurrentTab,
		onDragProvider: x.onDragProvider
	}

	const props_form: IPropsForm = {
		provider: deepClone(x.provider),
		test: deepClone(x.test),
		current_model: x.current_model,
		adding_model: x.adding_model,
		onTest: x.onTest,
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
		custom_providers: deepClone(target_config?.custom_providers),
		onChangeCustomProviders: x.onChangeCustomProviders
	}

	const props_disabled: IPropsDisabled = {
		items: providers.disabled,
		onEnableProvider: x.onEnableProvider
	}

	if (!x.config || !target_config) return

	return (
		<GlobalState value={{ locales: target_locales, icons }}>
			<div style={{ width }} className='flex flex-col items-center gap-8'>
				<Tab {...props_tab} />
				<AnimateBox className='w-full'>
					{x.current_tab === props_tab.items.length - 1 ? (
						<Disabled {...props_disabled} />
					) : x.current_tab === props_tab.items.length - 2 ? (
						<Custom {...props_custom} />
					) : (
						<Form {...props_form} />
					)}
					<Show
						className='text-xsm overflow-hidden py-2 text-rose-400'
						visible={x.upload_error !== ''}
						initial={{ opacity: 0, width: 0 }}
						animate={{ opacity: 1, width: 'auto' }}
					>
						{x.upload_error}
					</Show>
				</AnimateBox>
			</div>
		</GlobalState>
	)
}

export default memo(Index)

export * from './types'
