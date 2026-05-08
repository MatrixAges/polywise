import { useEffect, useMemo } from 'react'
import { useMemoizedFn, useToggle } from 'ahooks'
import { Plus } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { deepEqual } from 'stk/react'

import { Show } from '@/components'

import Form from './Form'
import Provider from './Provider'

import styles from '../../index.module.css'

import type { Provider as ProviderType } from '@core/types'
import type { IPropsCustom } from '../../types'

const Index = (props: IPropsCustom) => {
	const { customProviders = [], onChangeCustomProviders } = props
	const { t } = useTranslation()
	const [visible, { toggle }] = useToggle()

	const { control, formState, getValues } = useForm<{ providers: Array<ProviderType> }>({
		values: { providers: customProviders }
	})

	const { fields, prepend, remove, update } = useFieldArray({
		control,
		name: 'providers',
		keyName: '_'
	})

	const target_fields = useMemo(() => {
		return fields.map(item => {
			// @ts-ignore
			delete item['_']

			return item
		})
	}, [fields])

	const checkExist = useMemoizedFn((name: string) => {
		const target = customProviders.find(item => item.name === name)

		return Boolean(target)
	})

	const onAddProvider = useMemoizedFn((v: ProviderType) => {
		prepend({ ...v, enabled: true, models: [] })
	})

	const onChange = useMemoizedFn(() => {
		const values = getValues()

		if (deepEqual(values, customProviders)) return

		onChangeCustomProviders($copy(values.providers))
	})

	useEffect(() => {
		if (formState.isDirty) onChange()
	}, [formState.isDirty])

	return (
		<div
			className='
				flex flex-col
				w-full
				gap-5
				pt-3
			'
		>
			<div
				className='
					overflow-hidden
					flex
					items-center justify-between
					h-13
					px-3
					rounded-full
					text-sm
					border border-border-light
				'
			>
				<button className='click_button' type='button' onClick={toggle}>
					<Plus size={14} />
					{t('provider.form.custom.add_provider')}
				</button>
				<span className='text-gray'>{t('provider.form.custom.openai_compatible')}</span>
			</div>
			<Show
				className='overflow-hidden'
				visible={visible}
				initial={{ opacity: 0, height: 0 }}
				animate={{ opacity: 1, height: 'auto' }}
			>
				<Form {...{ toggle, checkExist, onAddProvider }} />
			</Show>
			{target_fields.length > 0 && (
				<div className='flex w-full flex-col gap-2.5'>
					<span className={styles.label}>{t('provider.form.custom.providers')}</span>
					<div className='flex flex-col gap-5'>
						{target_fields.map((item, index) => (
							<Provider {...{ index, item, update, remove }} key={item.name} />
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)
