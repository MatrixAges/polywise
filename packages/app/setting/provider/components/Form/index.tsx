import { useEffect, useMemo, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Download, EyeClosed, Plus, RotateCw, Trash, Upload } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { deepEqual } from 'stk/react'

import { Switch } from '@/__shadcn__/components/ui/switch'
import { Controller, Show } from '@/components'

import { useGlobalState } from '../../context'
import { all_providers } from '../../providers'
import APIKey from './APIKey'
import BaseUrl from './BaseUrl'
import CustomFields from './CustomFields'
import ModelForm from './ModelForm'
import Models from './Models'

import styles from '../../index.module.css'

import type { DragEndEvent } from '@dnd-kit/core'
import type { IPropsForm, Model, SpecialProvider } from '../../types'

const Index = (props: IPropsForm) => {
	const {
		provider,
		test,
		current_model,
		adding_model,
		custom,
		onTest,
		onChangeProvider,
		download,
		upload,
		onChangeCurrentModel,
		toggleAddingModel,
		onDisableProvider,
		onRemoveProvider
	} = props
	const { locales } = useGlobalState()

	const { name, api_key, base_url } = provider

	const [error, setError] = useState('')

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

			return setError(locales.form.error.id_required)
		}

		if (target_fields.find(item => item.id === values['id'])) {
			setFocus('id')

			return setError(locales.form.error.id_exsit)
		}

		if (!values['name']) {
			setFocus('name')

			return setError(locales.form.error.name_required)
		}

		prepend({ ...values, enabled: true, features: values.features || {} })

		onCancel()
	})

	const resetModels = useMemoizedFn(() => {
		const target_provider = all_providers.find(item => item.name === name)

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

	return (
		<div className='flex w-full flex-col gap-5'>
			<form className='flex w-full flex-col gap-5'>
				{custom && (
					<div
						className='
							flex
							items-center justify-between
							pb-2
							text-sm
							border-b border-border-gray
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
								<Trash className='text-base' />
							</button>
							<Controller name='enabled' control={control}>
								<Switch />
							</Controller>
						</div>
					</div>
				)}
				<APIKey title={locales.form.api_key} {...{ api_key, custom, test, onTest, register }} />
				<BaseUrl title={locales.form.base_url} {...{ base_url, custom, register }} />
				<CustomFields custom_fields={(provider as SpecialProvider).custom_fields} register={register} />
				<div className='flex flex-col gap-2.5'>
					<div className='flex items-center justify-between'>
						<span className={`${styles.label}`}>{locales.form.models}</span>
						{custom && (
							<button
								className='
									px-1.5 py-0.5
									rounded-2xl
									text-xsm
									btn
								'
								type='button'
								onClick={toggleAddingModel}
							>
								<Plus className='text-sm' />
								{locales.form.add_model}
							</button>
						)}
					</div>
					<Models
						models={target_fields}
						{...{
							locales,
							current_model,
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
				className='overflow-hidden'
				visible={adding_model}
				initial={{ opacity: 0, height: 0 }}
				animate={{ opacity: 1, height: 'auto' }}
			>
				<form className='flex flex-col gap-2.5' onSubmit={handleSubmit(onSubmit)}>
					<div className='flex items-center justify-between'>
						<div className={`flex items-center gap-3${styles.label}`}>
							{locales.form.add_model}
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
						<div className='text-xsm flex gap-1'>
							<button
								className='btn rounded-2xl px-1.5 py-0.5'
								type='button'
								onClick={onCancel}
							>
								{locales.form.cancel}
							</button>
							<button className='btn rounded-2xl px-1.5 py-0.5' type='submit'>
								{locales.form.submit}
							</button>
						</div>
					</div>
					<div
						className='
							flex flex-col
							rounded-2xl
							text-xsm
							bg-bg-main
							border border-b-2 border-border-gray
						'
					>
						<ModelForm control={control_model} adding_model register={register_model} />
					</div>
				</form>
			</Show>
			{!custom && (
				<div className='flex flex-col gap-2.5'>
					<span className={`${styles.label}`}>{locales.form.actions}</span>
					<div
						className='
							overflow-hidden
							flex
							justify-between
							p-3
							rounded-2xl
							text-xsm
							bg-bg-main
							border border-border-gray
						'
					>
						<div className='flex'>
							<button
								className='btn rounded-2xl px-2.5 py-1.5'
								type='button'
								onClick={toggleAddingModel}
							>
								<Plus className='text-sm' />
								{locales.form.add_model}
							</button>
							<button
								className='btn rounded-2xl px-2.5 py-1.5'
								type='button'
								onClick={resetModels}
							>
								<RotateCw className='text-sm' />
								{locales.form.reset_model}
							</button>
							<button
								className='btn rounded-2xl px-2.5 py-1.5'
								type='button'
								onClick={download}
							>
								<Download className='text-sm' />
								{locales.form.export_config}
							</button>
							<button
								className='btn rounded-2xl px-2.5 py-1.5'
								type='button'
								onClick={upload}
							>
								<Upload className='text-sm' />
								{locales.form.import_config}
							</button>
						</div>
						<button
							className='
								px-2.5 py-1.5
								rounded-2xl
								text-rose-400
								btn
							'
							onClick={onDisableProvider}
						>
							<EyeClosed className='text-sm' />
							{locales.form.disable_provider}
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)
