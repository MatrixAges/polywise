import { $ } from '@website/utils'

import styles from './index.module.css'

import type { ReactNode } from 'react'

interface IProps {
	src: string
	width: number
	children: ReactNode
}

const Index = (props: IProps) => {
	const { src, width, children } = props

	return (
		<div className={$.cx('flex w-full items-start', styles._local)}>
			<img alt='img' width={width} src={src} />
			<div className='img_container box-border' style={{ width: `calc(100% - ${width}px)` }}>
				{children}
			</div>
		</div>
	)
}

export default $.memo(Index)
