import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { useForm } from '@/hooks'

import { ConfigSection, ProviderSection } from './components'
import { Context } from './context'
import Model from './model'

import type { AppConfig } from '@core/types'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const { control } = useForm<AppConfig>({ values: x.form_values }, x.onConfigChange)

	useEffect(() => {
		void x.init()
	}, [x])

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
