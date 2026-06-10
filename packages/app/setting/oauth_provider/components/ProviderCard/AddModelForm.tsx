import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'

import { model_types } from './helpers'

import type { Model } from '@core/types'

type AddModelFormProps = {
	visible: boolean
	disabled: boolean
	models: Array<Model>
	onAdd: (model: Model) => Promise<boolean>
	onCancel: () => void
}

const Index = (props: AddModelFormProps) => {
	const { visible, disabled, models, onAdd, onCancel } = props
	const { t } = useTranslation('setting')
	const [id, setId] = useState('')
	const [name, setName] = useState('')
	const [type, setType] = useState<(typeof model_types)[number]>('text')
	const [error, setError] = useState('')

	useEffect(() => {
		if (visible) {
			return
		}

		setId('')
		setName('')
		setType('text')
		setError('')
	}, [visible])

	const onSubmit = async () => {
		const next_id = id.trim()
		const next_name = name.trim()

		if (!next_id) {
			setError(t('oauth_provider.model_id_required'))
			return
		}

		if (!next_name) {
			setError(t('oauth_provider.model_name_required'))
			return
		}

		if (models.some(model => model.id === next_id)) {
			setError(t('oauth_provider.model_id_exists'))
			return
		}

		const added = await onAdd({
			id: next_id,
			name: next_name,
			enabled: true,
			type
		})

		if (added) {
			onCancel()
		}
	}

	return (
		<div
			className='
				flex flex-col
				gap-3
				px-3 py-3
				rounded-xl
				border border-dashed border-border/70
			'
		>
			<div className='grid gap-3 md:grid-cols-3'>
				<input
					className='
						h-10
						px-3
						rounded-lg
						text-sm
						bg-background
						border border-border outline-none
					'
					placeholder={t('oauth_provider.model_id')}
					value={id}
					disabled={disabled}
					onChange={event => setId(event.target.value)}
				/>
				<input
					className='
						h-10
						px-3
						rounded-lg
						text-sm
						bg-background
						border border-border outline-none
					'
					placeholder={t('oauth_provider.model_name')}
					value={name}
					disabled={disabled}
					onChange={event => setName(event.target.value)}
				/>
				<Select value={type} onValueChange={value => setType(value as (typeof model_types)[number])}>
					<SelectTrigger className='h-10'>
						<SelectValue placeholder={t('oauth_provider.model_type')} />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{model_types.map(item => (
								<SelectItem key={item} value={item}>
									{item}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
			<div className='flex items-center justify-between gap-3'>
				<div className='text-sm text-rose-500'>{error}</div>
				<div className='flex items-center gap-2'>
					<Button type='button' variant='ghost' size='sm' disabled={disabled} onClick={onCancel}>
						{t('oauth_provider.cancel')}
					</Button>
					<Button type='button' size='sm' disabled={disabled} onClick={() => void onSubmit()}>
						{t('oauth_provider.add_model')}
					</Button>
				</div>
			</div>
		</div>
	)
}

export default Index
