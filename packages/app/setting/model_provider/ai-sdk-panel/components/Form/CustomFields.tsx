import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import styles from '../../index.module.css'

import type { IPropsFormCustomFields } from '../../types'

const Index = (props: IPropsFormCustomFields) => {
	const { custom_fields, register } = props
	const { t } = useTranslation()

	const fields = custom_fields || {}
	const keys = Object.keys(fields)

	if (!keys.length) return null

	return (
		<Fragment>
			{keys.map(key => (
				<div key={key} className='flex flex-col gap-2.5'>
					<span className={$cx(`capitalize`, styles.label)}>{key.replaceAll('_', '')}</span>
					<input
						className={$cx(
							`
							h-14
							border-border-light
						`,
							styles.input_wrap,
							styles.input
						)}
						placeholder={`Input field ${key}`}
						autoComplete='off'
						{...register(`custom_fields.${key}`)}
					/>
				</div>
			))}
		</Fragment>
	)
}

export default $app.memo(Index)
