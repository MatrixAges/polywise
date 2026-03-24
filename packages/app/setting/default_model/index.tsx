import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Controller, ModelSelect } from '@/components'
import { useGlobal } from '@/context'
import { useForm } from '@/hooks'

import type { AppConfig } from '@core/types'
import type { Control } from 'react-hook-form'

const Index = () => {
	const global = useGlobal()
	const s = global.setting

	const onChange = useMemoizedFn(values => s.setConfig('config', values))

	const { control } = useForm<AppConfig>({ values: s.config }, onChange)

	return (
		<form className='page_wrap flex w-full flex-col'>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Default Model</FieldTitle>
						<FieldDescription>Select the default model for session</FieldDescription>
					</FieldContent>
					<Controller name='default_model' control={control}>
						<ModelSelect></ModelSelect>
					</Controller>
				</Field>
			</FieldGroup>
			<div className='bg-border-light my-2 h-px w-full'></div>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Generate Triples</FieldTitle>
						<FieldDescription>Enable generate triples for article</FieldDescription>
					</FieldContent>
					<Controller name='enable_triple' control={control}>
						<Switch></Switch>
					</Controller>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Triple Model</FieldTitle>
						<FieldDescription>
							Select triple model for generating triples for content
						</FieldDescription>
					</FieldContent>
					<Controller name='triple_model' control={control}>
						<ModelSelect></ModelSelect>
					</Controller>
				</Field>
			</FieldGroup>
			<div className='bg-border-light my-2 h-px w-full'></div>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Search Rewrite</FieldTitle>
						<FieldDescription>Enable generation model to rewirte search</FieldDescription>
					</FieldContent>
					<Controller name='enable_rewrite' control={control}>
						<Switch></Switch>
					</Controller>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Rewrite Model</FieldTitle>
						<FieldDescription>Select model to generate rewrited search params</FieldDescription>
					</FieldContent>
					<Controller name='rewrite_model' control={control}>
						<ModelSelect></ModelSelect>
					</Controller>
				</Field>
			</FieldGroup>
		</form>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
