import { useMemo } from 'react'
import { $ } from '@website/utils'

import ImageWrap from '../ImageWrap'

import styles from './index.module.css'

import type { ReactNode } from 'react'

interface IProps {
	src: string
	width: number
	children: ReactNode
}

const Index = (props: IProps) => {
	const { src, width, children } = props

	const large = useMemo(() => width > 90, [width])

	return (
		<div className={$.cx('box-border flex w-full items-start', styles._local, large && styles.large)}>
			<div className='img_container box-border' style={{ width: `calc(100% - ${width}px)` }}>
				{children}
			</div>
			<ImageWrap src={src} width={width} small black></ImageWrap>
		</div>
	)
}

export default $.memo(Index)
