import { useEffect, useMemo, useState } from 'react'
import { AppConfig } from '@core/types'
import { useMemoizedFn } from 'ahooks'
import { observer } from 'mobx-react-lite'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { ModelSelect } from '@/components'
import { useGlobal } from '@/context'

const Index = () => {
	const global = useGlobal()
	const s = global.setting
	const default_model = s.config?.default_model ? s.config.default_model : null
	const triple_model = s.config?.triple_model ? s.config.triple_model : null
	const rewrite_model = s.config?.rewrite_model ? s.config.rewrite_model : null

	const setDefaultModel = useMemoizedFn(v => {
		s.setConfig('config', { provider: v } as Partial<AppConfig>)
	})

	const setTripleModel = useMemoizedFn(v => {
		s.setConfig('config', { triple_model: v } as Partial<AppConfig>)
	})

	const setRewriteModel = useMemoizedFn(v => {
		s.setConfig('config', { rewrite_model: v } as Partial<AppConfig>)
	})

	return (
		<div className='page_wrap flex w-full flex-col'>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Default Model</FieldTitle>
						<FieldDescription>Select the default model for session</FieldDescription>
					</FieldContent>
					<ModelSelect value={default_model!} onChange={setDefaultModel}></ModelSelect>
				</Field>
			</FieldGroup>
			<div className='bg-border-light my-2 h-px w-full'></div>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Generate Triples</FieldTitle>
						<FieldDescription>Enable generate triples for article</FieldDescription>
					</FieldContent>
					<Switch></Switch>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Triple Model</FieldTitle>
						<FieldDescription>
							Select triple model for generating triples for content
						</FieldDescription>
					</FieldContent>
					<ModelSelect value={triple_model!} onChange={setTripleModel}></ModelSelect>
				</Field>
			</FieldGroup>
			<div className='bg-border-light my-2 h-px w-full'></div>
			<FieldGroup className='gap-0'>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Search Rewrite</FieldTitle>
						<FieldDescription>Enable generation model to rewirte search</FieldDescription>
					</FieldContent>
					<Switch></Switch>
				</Field>
				<Field className='items-center! py-3' orientation='horizontal'>
					<FieldContent>
						<FieldTitle className='text-base'>Rewrite Model</FieldTitle>
						<FieldDescription>Select model to generate rewrited search params</FieldDescription>
					</FieldContent>
					<ModelSelect value={rewrite_model!} onChange={setRewriteModel}></ModelSelect>
				</Field>
			</FieldGroup>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
