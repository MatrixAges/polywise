import styles from '../../index.module.css'

import type { IPropsFormBaseUrl } from '../../types'

const Index = (props: IPropsFormBaseUrl) => {
	const { title, base_url, custom, register } = props

	if (base_url === undefined) return null

	return (
		<div className='flex flex-col gap-2.5'>
			<span className={`${styles.label}`}>{title}</span>
			<input
				className={`
					border-border-gray
					${styles.input_wrap} ${styles.input}
					${custom ? 'h-9 px-3!' : 'h-14'}
				`}
				autoComplete='off'
				{...register('base_url')}
			/>
		</div>
	)
}

export default $app.memo(Index)
