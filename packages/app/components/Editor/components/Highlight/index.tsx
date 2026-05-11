import Color from 'color'

import styles from './index.module.css'

import type { CSSProperties } from 'react'

interface IProps {
	getColorActive: (v: string) => boolean
	getbackgroundActive: (v: string) => boolean
	onSelect: (type: 'color' | 'background', v: string) => void
}

const colors = [
	'',
	'rgb(120, 119, 116)',
	'rgb(159, 107, 83)',
	'rgb(217, 115, 13)',
	'rgb(203, 145, 47)',
	'rgb(68, 131, 97)',
	'rgb(51, 126, 169)',
	'rgb(144, 101, 176)',
	'rgb(193, 76, 138)',
	'rgb(212, 76, 71)'
]

const backgrounds = [
	'',
	'rgb(248, 248, 247)',
	'rgb(244, 238, 238)',
	'rgb(251, 236, 221)',
	'rgb(251, 243, 219)',
	'rgb(237, 243, 236)',
	'rgb(231, 243, 248)',
	'rgb(248, 243, 252)',
	'rgb(252, 241, 246)',
	'rgb(253, 235, 236)'
]

const Index = (props: IProps) => {
	const { getColorActive, getbackgroundActive, onSelect } = props

	return (
		<div className={$cx('flex_column flex', styles._local)}>
			<div className='color_items color'>
				{colors.map(item => (
					<span
						className={$cx(
							`
							flex
							border_box
							justify_center align_center clickable
						`,
							item && getColorActive(Color(item).hex()) && 'active'
						)}
						style={
							{
								'--color': item ? item : 'var(--color_text)',
								'--border_color': item ? item : 'var(--color_text)'
							} as CSSProperties
						}
						onClick={() => onSelect('color', item ? Color(item).hex() : '')}
						key={item}
					>
						A
					</span>
				))}
			</div>
			<div className='color_items background'>
				{backgrounds.map(item => (
					<span
						className={$cx(
							'border_box clickable',
							item && getbackgroundActive(Color(item).hex()) && 'active'
						)}
						style={
							{
								'--color': item ? item : 'var(--color_bg)',
								'--border_color': item
									? Color(item).darken(0.1).toString()
									: 'var(--color_border)'
							} as CSSProperties
						}
						onClick={() => onSelect('background', item ? Color(item).hex() : '')}
						key={item}
					></span>
				))}
			</div>
		</div>
	)
}

export default Index
