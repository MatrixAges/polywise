import { useEffect, useState } from 'react'
import NiceAvatar from 'react-nice-avatar'
import NotionAvatar from 'react-notion-avatar'

import type { CSSProperties } from 'react'
import type { AgentAvatarConfig, AgentItem } from '../types'

interface IProps {
	item: Pick<AgentItem, 'name' | 'photo' | 'avatar'>
	size?: 'small' | 'large'
}

const size_map = {
	small: 32,
	large: 88
} as const

const Index = (props: IProps) => {
	const { item, size = 'large' } = props
	const box_size = size_map[size]
	const avatar_config = item.avatar as AgentAvatarConfig | null
	const photo = item.photo as Uint8Array | null
	const wrapper_style = { width: box_size, height: box_size } as CSSProperties
	const [photo_url, setPhotoUrl] = useState('')

	useEffect(() => {
		if (!photo) {
			setPhotoUrl('')

			return
		}

		const next_url = URL.createObjectURL(new Blob([photo]))

		setPhotoUrl(next_url)

		return () => URL.revokeObjectURL(next_url)
	}, [photo])

	if (photo_url) {
		return (
			<div className='bg-secondary/40 overflow-hidden rounded-lg' style={wrapper_style}>
				<img className='h-full w-full object-cover' src={photo_url} alt={item.name} />
			</div>
		)
	}

	if (avatar_config?.type === 'nice') {
		return <NiceAvatar className='rounded-lg' style={wrapper_style} shape='rounded' {...avatar_config.data} />
	}

	if (avatar_config?.type === 'notion') {
		return (
			<NotionAvatar
				className='rounded-lg'
				style={wrapper_style}
				shape='rounded'
				config={avatar_config.data}
			/>
		)
	}

	return (
		<div
			className='
				flex
				items-center justify-center
				rounded-lg
				text-sm font-medium
				uppercase
				bg-secondary/50
			'
			style={wrapper_style}
		>
			{item.name.slice(0, 1) || 'A'}
		</div>
	)
}

export default $app.memo(Index)
