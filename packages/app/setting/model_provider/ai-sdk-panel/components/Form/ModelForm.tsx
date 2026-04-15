import { useTranslation } from 'react-i18next'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'
import { AutoLabel, Controller } from '@/components'

import type { Model } from '@core/types'
import type { UseFormRegister } from 'react-hook-form'
import type { IPropsForm, IPropsFormModelForm } from '../../types'

const MODEL_TYPES = ['text', 'embedding', 'rerank', 'image', 'audio', 'video']

const Index = (props: IPropsFormModelForm) => {
	const { index = 0, item, adding_model, control, register } = props
	const { name, id, type } = item || {}

	const { t } = useTranslation()

	return (
		<div className='flex flex-col'>
			<div className='grid grid-cols-2'>
				<AutoLabel
					className={$cx(`border-r`, adding_model && 'border-b-0!')}
					label={t('provider.form.model_form.model_id')}
					valued={id || adding_model}
				>
					<input
						className={$cx(`
							w-full h-full
							leading-none
							outline-none
							disabled:text-gray
							placeholder:text-soft
						`)}
						placeholder={
							t('provider.form.model_form.input') + t('provider.form.model_form.model_id')
						}
						autoComplete='off'
						disabled={!adding_model}
						{...(adding_model
							? (register as UseFormRegister<Model>)('id')
							: (register as UseFormRegister<IPropsForm['provider']>)(
									`models.${index}.id`
								))}
					/>
				</AutoLabel>
				<AutoLabel
					className={adding_model ? 'border-b-0!' : ''}
					label={t('provider.form.model_form.model_name')}
					valued={name || adding_model}
				>
					<input
						className={$cx(`
							w-full h-full
							leading-none
							outline-none
							placeholder:text-soft
						`)}
						placeholder={
							t('provider.form.model_form.input') + t('provider.form.model_form.model_name')
						}
						autoComplete='off'
						{...(adding_model
							? (register as UseFormRegister<Model>)('name')
							: (register as UseFormRegister<IPropsForm['provider']>)(
									`models.${index}.name`
								))}
					/>
				</AutoLabel>
			</div>
			<div className='grid grid-cols-1'>
				<AutoLabel
					className={adding_model ? 'border-b-0!' : ''}
					label={t('provider.form.model_form.model_type')}
					valued={type || adding_model}
				>
					<Controller name={adding_model ? 'type' : `models.${index}.type`} control={control}>
						<Select items={MODEL_TYPES.map(t => ({ label: t, value: t }))}>
							<SelectTrigger
								className='
									h-full!
									p-0
									bg-transparent
									border-0 outline-none
									shadow-none
									focus:ring-0
								'
							>
								<SelectValue placeholder='Select type' />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{MODEL_TYPES.map(item => (
										<SelectItem value={item} key={item}>
											{item}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Controller>
				</AutoLabel>
			</div>
		</div>
	)
}

export default $app.memo(Index)
