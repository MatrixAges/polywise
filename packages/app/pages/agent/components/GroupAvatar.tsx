import { useEffect, useMemo } from 'react'

import type { CSSProperties } from 'react'
import type { GroupItem } from '../types'

interface IProps {
	item: Pick<GroupItem, 'name' | 'photo'>
	size?: 'small' | 'large' | number
	shape?: 'circle' | 'rounded'
	photo_url?: string
}

const default_avatar_url = '/images/bird.jpg'

const size_map = {
	small: 36,
	large: 60
} as const

const Index = ({ item, size = 'large', shape = 'circle', photo_url = '' }: IProps) => {
	const box_size = typeof size === 'number' ? size : size_map[size]
	const photo = item.photo as Uint8Array | null
	const wrapper_style = { width: box_size, height: box_size } as CSSProperties
	const is_rounded = shape === 'rounded'
	const object_photo_url = useMemo(() => {
		if (photo_url || !photo) {
			return ''
		}

		return URL.createObjectURL(new Blob([new Uint8Array(photo)]))
	}, [photo, photo_url])
	const resolved_photo_url = photo_url || object_photo_url || default_avatar_url

	useEffect(() => {
		if (!object_photo_url) {
			return
		}

		return () => URL.revokeObjectURL(object_photo_url)
	}, [object_photo_url])

	return (
		<div
			className={$cx('bg-secondary/40 overflow-hidden', is_rounded ? 'rounded-[24px]' : 'rounded-full')}
			style={wrapper_style}
		>
			<img className='h-full w-full object-cover' src={resolved_photo_url} alt={item.name || 'Group'} />
		</div>
	)
}

export default $app.memo(Index)
