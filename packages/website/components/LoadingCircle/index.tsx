'use client'

import { $ } from '@website/utils'
import { Loader2 } from 'lucide-react'

import styles from './index.module.css'

interface IProps {
	className?: HTMLDivElement['className']
	size?: number
	color?: string
}

const Index = (props: IProps) => {
	const { className, size = 48, color = 'var(--color_text)' } = props

	return (
		<div className={$.cx('flex', styles._local, className)} style={{ width: size, height: size }}>
			<Loader2 className='h-full w-full' strokeWidth={1} color={color}></Loader2>
		</div>
	)
}

export default $.memo(Index)
