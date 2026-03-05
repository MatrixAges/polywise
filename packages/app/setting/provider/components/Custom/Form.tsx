import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { AutoLabel, Show } from '@/components'

import styles from '../../index.module.css'

import type { IPropsCustomForm, Provider } from '../../types'

const Index = (props: IPropsCustomForm) => {
	const { toggle, checkExist, onAddProvider } = props
	const { t } = useTranslation()
	const [error, setError] = useState('')

	const { register, handleSubmit, reset } = useForm<Provider>({})

	const clearError = useMemoizedFn(() => setError(''))

	const onCancel = useMemoizedFn(() => {
		reset()
		setError('')
		toggle()
	})

	const onSubmit = useMemoizedFn((values: Provider) => {
		if (checkExist(values.name)) {
			setTimeout(() => setError(''), 2400)

			return setError(t('provider.form.custom.error', { name: `'${values.name}'` }))
		}

		onAddProvider(values)
		onCancel()
	})

	return (
		<form className='flex flex-col gap-2.5' onSubmit={handleSubmit(onSubmit)}>
			<div className='flex items-center justify-between'>
				<div className={`flex items-center gap-3${styles.label}`}>
					{t('provider.form.custom.add_provider')}
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
					<button className='btn rounded-2xl px-1.5 py-0.5' type='button' onClick={onCancel}>
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
					rounded-2xl
					text-xsm
					bg-bg-main
					border border-border-gray
				'
			>
				<AutoLabel label={t('provider.form.custom.provider_name')} valued>
					<input
						className={`
							w-full h-full
							leading-none
							outline-none
							placeholder:text-soft
						`}
						placeholder={
							t('provider.form.model_form.input') + t('provider.form.custom.provider_name')
						}
						autoComplete='off'
						required
						{...register('name')}
					/>
				</AutoLabel>
				<AutoLabel label={t('provider.form.base_url')} valued>
					<input
						className={`
							w-full h-full
							leading-none
							outline-none
							placeholder:text-soft
						`}
						placeholder={locales.form.model_form.input + locales.form.base_url}
						autoComplete='off'
						required
						{...register('base_url')}
					/>
				</AutoLabel>
				<AutoLabel label={locales.form.api_key} valued>
					<input
						className={`
							w-full h-full
							leading-none
							outline-none
							placeholder:text-soft
						`}
						placeholder={locales.form.model_form.input + locales.form.api_key}
						autoComplete='off'
						{...register('api_key')}
					/>
				</AutoLabel>
				<AutoLabel className='border-b-0' label={locales.form.custom.headers} valued>
					<input
						className={`
							w-full h-full
							leading-none
							outline-none
							placeholder:text-soft
						`}
						placeholder={locales.form.custom.headers_placeholder}
						autoComplete='off'
						{...register('headers')}
					/>
				</AutoLabel>
			</div>
		</form>
	)
}

export default $app.memo(Index)
