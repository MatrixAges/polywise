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
					className='cls-2'
					d='M92 91h40v40H92zM92 133h40v40H92zM92 175h40v40H92zM92 217h40v40H92zM92 259h40v40H92z'
					fill={fillColor}
				/>
				<g>
					<path
						className='cls-2'
						d='M174 91h40v40h-40zM174 133h40v40h-40zM174 175h40v40h-40zM174 217h40v40h-40zM174 259h40v40h-40z'
						fill={fillColor}
					/>
					<g>
						<path
							className='cls-2'
							d='M216 175h40v40h-40zM258 175h40v40h-40z'
							fill={fillColor}
						/>
					</g>
					<g>
						<path className='cls-2' d='M216 91h40v40h-40zM258 91h40v40h-40z' fill={fillColor} />
					</g>
				</g>
			</svg>
		</div>
	)
}

export default $.memo(Index)
