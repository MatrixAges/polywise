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
				<g>
					<g>
						<rect className='cls-1' x='47' y='46' width='40' height='40' />
						<rect className='cls-1' x='47' y='88' width='40' height='40' />
						<rect className='cls-1' x='47' y='130' width='40' height='40' />
						<rect className='cls-1' x='47' y='172' width='40' height='40' />
						<rect className='cls-1' x='47' y='214' width='40' height='40' />
					</g>
				</g>
				<g>
					<g>
						<rect className='cls-1' x='129' y='46' width='40' height='40' />
						<rect className='cls-1' x='129' y='88' width='40' height='40' />
						<rect className='cls-1' x='129' y='130' width='40' height='40' />
						<rect className='cls-1' x='129' y='172' width='40' height='40' />
						<rect className='cls-1' x='129' y='214' width='40' height='40' />
					</g>
					<g>
						<rect className='cls-1' x='171' y='130' width='40' height='40' />
						<rect className='cls-1' x='213' y='130' width='40' height='40' />
					</g>
					<g id='组_1' data-name='组 1'>
						<rect className='cls-1' x='171' y='46' width='40' height='40' />
						<rect className='cls-1' x='213' y='46' width='40' height='40' />
					</g>
				</g>
			</svg>
		</div>
	)
}

export default $.memo(Index)
