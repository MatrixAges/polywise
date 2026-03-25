import styles from '../../index.module.css'

import type { IPropsFormBaseUrl } from '../../types'

const Index = (props: IPropsFormBaseUrl) => {
	const { title, baseURL, custom, register } = props

	if (baseURL === undefined) return null

	return (
		<div className='flex flex-col gap-2.5'>
			<span className={$cx(styles.label)}>{title}</span>
			<input
				className={$cx(
					`
					border-border-light outline-border-gray
					focus-within:outline-1
				`,
					styles.input_wrap,
					styles.input,
					custom ? 'h-9 px-3!' : 'h-13'
				)}
				autoComplete='off'
				{...register('baseURL')}
			/>
		</div>
	)
}

export default $app.memo(Index)
