import { useEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'
import { deepEqual } from 'stk/react'
import { container } from 'tsyringe'

import { useGlobal } from '@/context'
import { useForm } from '@/hooks'

import { ConfigSection, ProviderSection } from './components'
import { Context } from './context'
import Model from './model'

import type { AppConfig } from '@core/types'

const Index = () => {
	const global = useGlobal()
	const s = global.setting
	const [x] = useState(() => container.resolve(Model))
	const { control, getValues, reset } = useForm<AppConfig>({ values: x.form_values }, x.onConfigChange)
	const write_config = useMemoizedFn((changed: Partial<AppConfig>) => {
		void s.setConfig('config', changed, true)
	})

	useEffect(() => {
		void x.init()
	}, [x])

	useEffect(() => {
		x.syncConfig({ config: s.config, writeConfig: write_config })
	}, [s.config, write_config, x])

	useEffect(() => {
		if (!s.config) {
			return
		}

		const next_form_values = x.form_values

		if (deepEqual(getValues(), next_form_values)) {
			return
		}

		reset(next_form_values)
	}, [getValues, reset, s.config, x, x.fallback_chain_key, x.form_values])

	useEffect(() => {
		x.syncProviderOrder()
	}, [x, x.fallback_chain_key])

	return (
		<Context value={x}>
			<div
				className='
					overflow-y-scroll
					flex flex-col
					w-full h-full
					gap-5
					page_wrap
				'
			>
				<ProviderSection></ProviderSection>
				<ConfigSection control={control}></ConfigSection>
			</div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
