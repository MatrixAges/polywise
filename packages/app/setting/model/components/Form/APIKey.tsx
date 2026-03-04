import { useMemo } from 'react'
import { CheckIcon, SpinnerIcon, WifiHighIcon, XIcon } from '@phosphor-icons/react'

import styles from '@/libs/Providers/index.module.css'
import { memo } from '@/utils'

import type { IPropsFormAPIKey } from '../../types'

const Index = (props: IPropsFormAPIKey) => {
	const { title, api_key, test, custom, onTest, register } = props
	const { loading, res } = test || {}

	const Status = useMemo(() => {
		if (loading) return <SpinnerIcon />
		if (res == null) return <WifiHighIcon />

		return res ? <CheckIcon size={16} weight='bold' /> : <XIcon size={15} weight='bold' />
	}, [loading, res])

	if (api_key === undefined) return

	return (
		<div className='flex flex-col gap-2.5'>
			<span className={`flex${styles.label}`}>{title}</span>
			<div
				className={`
					border-border-solid
					${styles.input_wrap}
					${custom ? 'h-9' : 'h-14'}
				`}
			>
				<input
					className={`
						h-full
						blur-xs
						focus:blur-none
						placeholder-shown:!blur-none
						${styles.input}
						${custom && '!px-3'}
					`}
					placeholder='sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
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

export default memo(Index)
