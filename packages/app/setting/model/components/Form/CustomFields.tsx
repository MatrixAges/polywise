import styles from '@/libs/Providers/index.module.css'
import { memo } from '@/utils'

import { useGlobalState } from '../../context'

import type { IPropsFormCustomFields } from '../../types'

const Index = (props: IPropsFormCustomFields) => {
	const { custom_fields, register } = props
	const { locales } = useGlobalState()

	const fields = custom_fields || {}
	const keys = Object.keys(fields)

	if (!keys.length) return

	return keys.map(key => (
		<div key={key} className='flex flex-col gap-2.5'>
			<span className={`capitalize${styles.label}`}>
				{locales.custom_fields[key as keyof typeof locales.custom_fields] || key.replaceAll('_', '')}
			</span>
			<input
				className={`
						h-14
						border-border-gray
						${styles.input_wrap} ${styles.input}
				`}
				placeholder={`Input field ${key}`}
				autoComplete='off'
				{...register(`custom_fields.${key}`)}
			/>
		</div>
	))
}

export default memo(Index)
