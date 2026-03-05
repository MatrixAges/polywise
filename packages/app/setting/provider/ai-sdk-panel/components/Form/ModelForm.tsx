import { useTranslation } from 'react-i18next'

import { AutoLabel } from '@/components'

import type { UseFormRegister } from 'react-hook-form'
import type { IPropsForm, IPropsFormModelForm, Model } from '../../types'

const Index = (props: IPropsFormModelForm) => {
	const { index = 0, item, adding_model, register } = props
	const { name, id } = item || {}

	const { t } = useTranslation()

	return (
		<div className='flex flex-col'>
			<div className='grid grid-cols-2'>
				<AutoLabel
					className='border-r'
					label={t('provider.form.model_form.model_id')}
					valued={id || adding_model}
				>
					<input
						className={`
							w-full h-full
							leading-none
							outline-none
							disabled:text-gray
							placeholder:text-soft
						`}
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
				<AutoLabel label={t('provider.form.model_form.model_name')} valued={name || adding_model}>
					<input
						className={`
							w-full h-full
							leading-none
							outline-none
							placeholder:text-soft
						`}
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
		</div>
	)
}

export default $app.memo(Index)
