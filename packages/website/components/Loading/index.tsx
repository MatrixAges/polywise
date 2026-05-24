'use client'

import Logo from '@website/components/Logo'
import useTheme from '@website/hooks/useTheme'
import { $ } from '@website/utils'

import styles from './index.module.css'

interface IProps {
	size?: number
	desc?: string
	use_by_component?: boolean
	className?: string
}

const Index = (props: IProps) => {
	const { size = 96, desc, use_by_component, className } = props
	const { theme } = useTheme()

	return (
		<div
			className={$.cx(
				'flex flex-col items-center justify-center',
				styles._local,
				styles[theme],
				use_by_component && styles.use_by_component,
				className
			)}
			style={{ '--loading_size': size + 'px' }}
		>
			<div className='loading_wrap relative'>
				<Logo
					className='
						absolute
						top-0
						left-0
						w-full h-full
						loading_icon bottom
					'
					size={size}
					color='inherit'
				></Logo>
				<Logo
					className='
						absolute
						top-0
						left-0
						w-full h-full
						loading_icon top
					'
					size={size}
					color='inherit'
				></Logo>
			</div>
			{desc && <span className='desc box-border text-center'>{desc}</span>}
		</div>
	)
}

export default $.memo(Index)
