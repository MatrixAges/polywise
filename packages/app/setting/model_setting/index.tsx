import { Fragment, useInsertionEffect } from 'react'
import { LocalModelType } from '@core/llama'
import { useMemoizedFn } from 'ahooks'
import { ArrowDownToLine, BadgeCheck } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Spinner } from '@/__shadcn__/components/ui/spinner'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { local_models } from '@/appdata'
import { Controller, ModelSelect } from '@/components'
import { useGlobal } from '@/context'
import { useClickLoading, useForm } from '@/hooks'
import { rpc } from '@/utils'

import type { AppConfig } from '@core/types'

const Index = () => {
	const global = useGlobal()
	const s = global.setting
	const { t } = useTranslation('setting')

	const { loading, click } = useClickLoading(2400)

	useInsertionEffect(() => {
		s.getModelStatus()
	}, [])

	const onChange = useMemoizedFn(values => {
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
			<form className='flex w-full flex-col'>
				<FieldGroup className='gap-0'>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>
								{t('model_setting.default_model')}
							</FieldTitle>
							<FieldDescription>{t('model_setting.default_model_desc')}</FieldDescription>
						</FieldContent>
						<Controller name='default_model' control={control}>
							<ModelSelect></ModelSelect>
						</Controller>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>
								{t('model_setting.embedding_model')}
							</FieldTitle>
							<FieldDescription>{t('model_setting.embedding_model_desc')}</FieldDescription>
						</FieldContent>
						<Controller name='embedding_model' control={control}>
							<ModelSelect filterType='embedding' showLocalModel></ModelSelect>
						</Controller>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>
								{t('model_setting.rerank_model')}
							</FieldTitle>
							<FieldDescription>{t('model_setting.rerank_model_desc')}</FieldDescription>
						</FieldContent>
						<Controller name='rerank_model' control={control}>
							<ModelSelect filterType='rerank' showLocalModel></ModelSelect>
						</Controller>
					</Field>
				</FieldGroup>
				<div className='bg-border-light my-2 h-px w-full'></div>
				<FieldGroup className='gap-0'>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>
								{t('model_setting.generate_triples')}
							</FieldTitle>
							<FieldDescription>
								{t('model_setting.generate_triples_desc')}
							</FieldDescription>
						</FieldContent>
						<Controller type='switch' name='enable_triple' control={control}>
							<Switch></Switch>
						</Controller>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>
								{t('model_setting.triple_model')}
							</FieldTitle>
							<FieldDescription>{t('model_setting.triple_model_desc')}</FieldDescription>
						</FieldContent>
						<Controller name='triple_model' control={control}>
							<ModelSelect showLocalModel></ModelSelect>
						</Controller>
					</Field>
				</FieldGroup>
				<div className='bg-border-light my-2 h-px w-full'></div>
				<FieldGroup className='gap-0'>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>
								{t('model_setting.search_rewrite')}
							</FieldTitle>
							<FieldDescription>{t('model_setting.search_rewrite_desc')}</FieldDescription>
						</FieldContent>
						<Controller type='switch' name='enable_rewrite' control={control}>
							<Switch></Switch>
						</Controller>
					</Field>
					<Field className='items-center! py-3' orientation='horizontal'>
						<FieldContent>
							<FieldTitle className='text-base'>
								{t('model_setting.rewrite_model')}
							</FieldTitle>
							<FieldDescription>{t('model_setting.rewrite_model_desc')}</FieldDescription>
						</FieldContent>
						<Controller name='rewrite_model' control={control}>
							<ModelSelect showLocalModel></ModelSelect>
						</Controller>
					</Field>
				</FieldGroup>
			</form>
			<div className='bg-border-light my-2 h-px w-full'></div>
			<div className='flex flex-col'>
				{Object.keys(local_models).map(key => (
					<div className='flex items-center justify-between py-3' key={key}>
						<div className='flex flex-col gap-1'>
							<span className='font-medium'>{local_models[key].name}</span>
							<div className='flex items-center text-xs'>
								<span className='text-std-600'>{local_models[key].model}</span>
								<span className='text-std-400 mx-2 font-bold'>·</span>
								<span className='text-std-400'>{local_models[key].size}</span>
							</div>
						</div>
						{s.model_status[key as LocalModelType] !== undefined ? (
							<div className='flex items-center'>
								{s.model_status[key as LocalModelType] ? (
									<div className='click_button'>
										<BadgeCheck></BadgeCheck>
										<span>{t('model_setting.ready')}</span>
									</div>
								) : s.model_progress[key as LocalModelType] ? (
									<span className='text-xsm font-medium'>
										{s.model_progress[key as LocalModelType]!.percent + '%'}
									</span>
								) : (
									<button
										className='click_button'
										onClick={() => {
											click()
											rpc.llama.download.mutate(key as LocalModelType)
										}}
										disabled={loading}
									>
										{loading ? (
											<Spinner></Spinner>
										) : (
											<Fragment>
												<ArrowDownToLine></ArrowDownToLine>
												<span>{t('model_setting.download')}</span>
											</Fragment>
										)}
									</button>
								)}
							</div>
						) : (
							<Spinner></Spinner>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
