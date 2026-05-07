import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSet,
	FieldTitle
} from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import { Controller } from '@/components'
import { useGlobal } from '@/context'
import { useForm } from '@/hooks'

import type { AppConfig } from '@core/types'

const Index = () => {
	const global = useGlobal()
	const s = global.setting

	const onChange = useMemoizedFn((values: AppConfig) => {
		s.setConfig('config', values)
	})

	const { control } = useForm<AppConfig>({ values: $copy(s.config) }, onChange)

	return (
		<div
			className='
				overflow-y-scroll
				flex flex-col
				w-full h-full
				page_wrap
			'
		>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='vertical'>
					<FieldContent>
						<FieldTitle className='text-base'>Jina API Key</FieldTitle>
						<FieldDescription>
							Used when fetching web pages through r.jina.ai and s.jina.ai.
						</FieldDescription>
					</FieldContent>
					<Controller name='jina_api_key' control={control}>
						<Input
							className='workspace_selector'
							type='password'
							placeholder='jina_...'
							autoComplete='off'
						/>
					</Controller>
				</Field>
			</FieldGroup>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
