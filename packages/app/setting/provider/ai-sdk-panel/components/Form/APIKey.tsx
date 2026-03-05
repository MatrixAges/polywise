import { useMemo } from 'react'
import { Check, Loader, Wifi, X } from 'lucide-react'

import styles from '../../index.module.css'

import type { IPropsFormAPIKey } from '../../types'

const Index = (props: IPropsFormAPIKey) => {
	const { title, api_key, test, custom, onTest, register } = props
	const { loading, res } = test || {}

	const Status = useMemo(() => {
		if (loading) return <Loader size={16} />
		if (res == null) return <Wifi size={16} />

		return res ? <Check size={16} /> : <X size={15} />
	}, [loading, res])

	if (api_key === undefined) return null

	return (
		<div className='flex flex-col gap-2.5'>
			<span
				className={`
					flex
					${styles.label}`}
			>
				{title}
			</span>
			<div
				className={`
					border-border-solid outline-border-gray
					focus-within:outline-1
					${styles.input_wrap}
					${custom ? 'h-9' : 'h-13'}
				`}
			>
				<input
					className={`
						h-full
						blur-xs
						focus:blur-none
						placeholder-shown:blur-none!
						${styles.input}
						${custom && 'px-3!'}
					`}
					placeholder='sk-xxxxxx'
					autoComplete='off'
					{...register('api_key')}
				/>
				{onTest && (
					<span
						className={`
							absolute
							right-2
							w-8 h-8
							rounded-full
							text-xl
							btn
							${loading && 'animate-spin'}
							${res !== null && (res ? 'text-lime-500' : 'text-rose-400')}
						`}
						onClick={onTest}
					>
						{Status}
					</span>
				)}
			</div>
		</div>
	)
}

export default $app.memo(Index)
