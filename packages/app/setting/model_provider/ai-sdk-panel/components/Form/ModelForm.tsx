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
	const { index = 0, item, addingModel, control, register } = props
	const { name, id, type } = item || {}

	const { t } = useTranslation()

	return (
		<div className='flex flex-col'>
			<div className='grid grid-cols-2'>
				<AutoLabel
					className={$cx(`border-r`, addingModel && 'border-b-0!')}
					label={t('provider.form.model_form.model_id')}
					valued={id || addingModel}
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
						disabled={!addingModel}
						{...(addingModel
							? (register as UseFormRegister<Model>)('id')
							: (register as UseFormRegister<IPropsForm['provider']>)(
									`models.${index}.id`
								))}
					/>
				</AutoLabel>
				<AutoLabel
					className={addingModel ? 'border-b-0!' : ''}
					label={t('provider.form.model_form.model_name')}
					valued={name || addingModel}
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
						{...(addingModel
							? (register as UseFormRegister<Model>)('name')
							: (register as UseFormRegister<IPropsForm['provider']>)(
									`models.${index}.name`
								))}
					/>
				</AutoLabel>
			</div>
			<div className='grid grid-cols-1'>
				<AutoLabel
					className={addingModel ? 'border-b-0!' : ''}
					label={t('provider.form.model_form.model_type')}
					valued={type || addingModel}
				>
					<Controller name={addingModel ? 'type' : `models.${index}.type`} control={control}>
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
								<SelectValue placeholder={t('provider.form.model_form.select_type')} />
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
