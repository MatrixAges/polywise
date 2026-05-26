import { useEffect, useMemo, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { EyeClosed, Plus, RotateCw, Trash } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { deepEqual } from 'stk/react'

import { Switch } from '@/__shadcn__/components/ui/switch'
import { Controller, ProviderIcon, Show } from '@/components'
import { rpc } from '@/utils'

import APIKey from './APIKey'
import BaseUrl from './BaseUrl'
import CustomFields from './CustomFields'
import ModelForm from './ModelForm'
import Models from './Models'

import styles from '../../index.module.css'

import type { Model, SpecialProvider } from '@core/types'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Control } from 'react-hook-form'
import type { ApiTestState, IPropsForm } from '../../types'

const Index = (props: IPropsForm) => {
	const {
		allProviders = [],
		provider,
		currentModel,
		addingModel,
		custom,
		onChangeProvider,
		onChangeCurrentModel,
		toggleAddingModel,
		onDisableProvider,
		onRemoveProvider
	} = props
	const { t } = useTranslation()

	const { name, apiKey, baseURL } = provider

	const [error, setError] = useState('')
	const [test, setTest] = useState<ApiTestState>({ loading: false, res: null })
	const timer_test = useRef<ReturnType<typeof setTimeout> | null>(null)

	const { control, formState, getValues, setValue, register } = useForm<IPropsForm['provider']>({
		values: provider
	})

	const { fields, prepend, remove, move } = useFieldArray({
		control,
		name: 'models',
		keyName: '_'
	})

	const target_fields = useMemo(() => {
		return fields.map(item => {
			// @ts-ignore
			delete item['_']

			return item
		})
	}, [fields])

	const { control: control_model, register: register_model, handleSubmit, reset, setFocus } = useForm<Model>()

	const onChange = useMemoizedFn(() => {
		const values = getValues()

		if (deepEqual(values, provider)) return

		onChangeProvider($copy(values))
	})

	useEffect(() => {
		if (formState.isDirty) onChange()
	}, [formState.isDirty])

	useEffect(() => {
		return () => {
			if (timer_test.current) clearTimeout(timer_test.current)
		}
	}, [])

	useEffect(() => {
		if (timer_test.current) clearTimeout(timer_test.current)

		setTest({ loading: false, res: null })
	}, [name])

	const clearError = useMemoizedFn(() => setError(''))

	const onCancel = useMemoizedFn(() => {
		reset()
		setError('')
		toggleAddingModel()
	})

	const onSubmit = useMemoizedFn(values => {
		setTimeout(() => setError(''), 2400)

		if (!values['id']) {
			setFocus('id')

			return setError(t('provider.form.error.id_required'))
		}

		if (target_fields.find(item => item.id === values['id'])) {
			setFocus('id')

			return setError(t('provider.form.error.id_exsit'))
		}

		if (!values['name']) {
			setFocus('name')

			return setError(t('provider.form.error.name_required'))
		}

		prepend({ ...values, enabled: true })

		onCancel()
	})

	const resetModels = useMemoizedFn(() => {
		const target_provider = allProviders.find(item => item.name === name)

		if (!target_provider) return

		setValue('models', target_provider.models, { shouldDirty: true })
	})

	const onDragModel = useMemoizedFn((args: DragEndEvent) => {
		const { active, over } = args

		if (!over?.id || active.id === over.id) return

		const active_index = target_fields.findIndex(item => item.id === active.id)
		const over_index = target_fields.findIndex(item => item.id === over.id)

		move(active_index, over_index)
	})

	const onTest = useMemoizedFn(async () => {
		if (timer_test.current) clearTimeout(timer_test.current)

		setTest({ loading: true, res: null })

		let res = false

		try {
			res = await rpc.provider.test.query(getValues())
		} catch (error) {
			console.error('[ai-sdk-panel] provider test failed', error)
		}

		setTest({ loading: false, res })

		timer_test.current = setTimeout(() => {
			setTest(prev => ({ ...prev, res: null }))
		}, 2400)
	})

	return (
		<div
			className='
				flex flex-col
				items-center
				w-full
				gap-6
			'
		>
			<div
				className='
					flex flex-col
					items-center
					gap-2
					pt-10
				'
			>
				<div
					className='
						flex
						items-center justify-center
						w-[72px] h-[36px]
						text-[36px]
					'
				>
					<ProviderIcon name={name} size={36}></ProviderIcon>
				</div>
				<span className='text-xl font-medium capitalize'>
					{custom ? name : t(`provider.providers.${name}` as any)}
				</span>
			</div>
			<form className='flex w-full flex-col gap-6'>
				{custom && (
					<div
						className='
							flex
							items-center justify-between
							pb-2
							text-sm
							border-b border-border-light
							capitalize
						'
					>
						<span>{name}</span>
						<div className='flex items-center gap-3'>
							<button
								className='btn rounded-2xl p-1.5'
								type='button'
								onClick={onRemoveProvider}
							>
								<Trash size={14} />
							</button>
							<Controller type='switch' name='enabled' control={control}>
								<Switch />
							</Controller>
						</div>
					</div>
				)}
				<APIKey title={t('provider.form.apiKey')} {...{ apiKey, custom, test, onTest, register }} />
				<BaseUrl title={t('provider.form.baseURL')} {...{ baseURL, custom, register }} />
				<CustomFields customFields={(provider as SpecialProvider).custom_fields} register={register} />
				<div className='flex flex-col gap-2.5'>
					<div className='flex items-center justify-between'>
						<span className={$cx(styles.label)}>{t('provider.form.models')}</span>
						{custom && (
							<button
								className='
									h-7
									click_button
								'
								type='button'
								onClick={toggleAddingModel}
							>
								<Plus size={14} />
								{t('provider.form.add_model')}
							</button>
						)}
					</div>
					<Models
						models={target_fields}
						{...{
							currentModel,
							control,
							custom,
							register,
							remove,
							onChangeCurrentModel,
							onDragModel
						}}
					/>
				</div>
			</form>
			<Show
				className='w-full overflow-hidden'
				visible={addingModel}
				initial={{ opacity: 0, height: 0 }}
				animate={{ opacity: 1, height: 'auto' }}
			>
				<form className='flex w-full flex-col gap-2.5' onSubmit={handleSubmit(onSubmit)}>
					<div className='flex items-center justify-between'>
						<div
							className={$cx(
								`
								flex
								items-center
								gap-3
							`,
								styles.label
							)}
						>
							{t('provider.form.add_model')}
							<Show
								className='
									overflow-hidden
									text-rose-400
									whitespace-nowrap
									cursor-pointer
								'
								visible={error !== ''}
								initial={{ opacity: 0, width: 0 }}
								animate={{ opacity: 1, width: 'auto' }}
								onClick={clearError}
							>
								{error}
							</Show>
						</div>
						<div className='flex gap-1 text-sm'>
							<button
								className='btn rounded-2xl px-1.5 py-0.5'
								type='button'
								onClick={onCancel}
							>
								{t('provider.form.cancel')}
							</button>
							<button className='btn rounded-2xl px-1.5 py-0.5' type='submit'>
								{t('provider.form.submit')}
							</button>
						</div>
					</div>
					<div
						className='
							overflow-hidden
							flex flex-col
							rounded-lg
							text-sm
							border border-border-light
						'
					>
						<ModelForm control={control_model} addingModel register={register_model} />
					</div>
				</form>
			</Show>
			{!custom && (
				<div className='flex w-full flex-col gap-2.5'>
					<span className={$cx(styles.label)}>{t('provider.form.actions')}</span>
					<div
						className='
							overflow-hidden
							flex flex-wrap
							items-center justify-between
							min-h-13
							px-3 py-2
							rounded-full
							text-sm
							border border-border-light
						'
					>
						<div className='flex items-center'>
							<button
								className='click_button h-7'
								type='button'
								onClick={toggleAddingModel}
							>
								<Plus size={14} />
								{t('provider.form.add_model')}
							</button>
							<button className='click_button h-7' type='button' onClick={resetModels}>
								<RotateCw size={14} />
								{t('provider.form.reset_model')}
							</button>
						</div>
						<button className='click_button h-7' onClick={onDisableProvider}>
							<EyeClosed size={14} />
							{t('provider.form.disable_provider')}
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)
