'use client'

import useTheme from '@website/hooks/useTheme'
import { $ } from '@website/utils'

interface IProps {
	className?: HTMLDivElement['className']
	size?: number
	color?: string
}

const Index = (props: IProps) => {
	const { theme } = useTheme()
	const { className, size = 48, color = theme === 'dark' ? 'var(--color_text)' : 'var(--color_main)' } = props

	return (
		<div className={$.cx('flex', className)} style={{ width: size, height: size, fill: color }}>
			<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 300 300'>
				<path d='M90,150h60a0,0,0,0,1,0,0V270a0,0,0,0,1,0,0H90a60,60,0,0,1-60-60v0A60,60,0,0,1,90,150Z' />
				<path d='M150,30h60a60,60,0,0,1,60,60v0a60,60,0,0,1-60,60H150a0,0,0,0,1,0,0V30A0,0,0,0,1,150,30Z' />
			</svg>
		</div>
	)
}

export default $.memo(Index)
