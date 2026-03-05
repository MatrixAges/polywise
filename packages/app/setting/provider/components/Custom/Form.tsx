import { useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { useForm } from 'react-hook-form'

import { AutoLabel, Show } from '@/components'

import { useGlobalState } from '../../context'

import styles from '../../index.module.css'

import type { IPropsCustomForm, Provider } from '../../types'

const Index = (props: IPropsCustomForm) => {
	const { toggle, checkExist, onAddProvider } = props
	const { locales } = useGlobalState()
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

			return setError(locales.form.custom.error.replace('{{name}}', `'${values.name}'`))
		}

		onAddProvider(values)
		onCancel()
	})

	return (
		<form className='flex flex-col gap-2.5' onSubmit={handleSubmit(onSubmit)}>
			<div className='flex items-center justify-between'>
				<div className={`flex items-center gap-3${styles.label}`}>
					{locales.form.custom.add_provider}
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
						{locales.form.cancel}
					</button>
					<button className='btn rounded-2xl px-1.5 py-0.5' type='submit'>
						{locales.form.submit}
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
				<AutoLabel label={locales.form.custom.provider_name} valued>
					<input
						className={`
							w-full h-full
							leading-none
							outline-none
							placeholder:text-soft
						`}
						placeholder={locales.form.model_form.input + locales.form.custom.provider_name}
						autoComplete='off'
						required
						{...register('name')}
					/>
				</AutoLabel>
				<AutoLabel label={locales.form.base_url} valued>
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
