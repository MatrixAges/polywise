'use client'

import { $ } from '@website/utils'

interface IProps {
	className?: HTMLDivElement['className']
	size?: number
	color?: string
	fillColor?: string
}

const Index = (props: IProps) => {
	const { className, size = 48, color = 'var(--color_main)', fillColor = 'white' } = props

	return (
		<div className={$.cx('flex', className)} style={{ maxWidth: size, maxHeight: size, fill: 'white' }}>
			<svg
				className='h-full w-full'
				xmlns='http://www.w3.org/2000/svg'
				width='390'
				height='390'
				viewBox='0 0 390 390'
			>
				<rect x='3' y='3' width='384' height='384' rx='72' ry='72' fill={color} />
				<path
					d='M135,195h60a0,0,0,0,1,0,0V315a0,0,0,0,1,0,0H135a60,60,0,0,1-60-60v0A60,60,0,0,1,135,195Z'
					fill={fillColor}
				/>
				<path
					d='M195,75h60a60,60,0,0,1,60,60v0a60,60,0,0,1-60,60H195a0,0,0,0,1,0,0V75A0,0,0,0,1,195,75Z'
					fill={fillColor}
				/>
			</svg>
		</div>
	)
}

export default $.memo(Index)
