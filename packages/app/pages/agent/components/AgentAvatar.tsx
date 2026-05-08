import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import NiceAvatar from 'react-nice-avatar'
import NotionAvatar from 'react-notion-avatar'

import { useModel } from '../context'

import type { CSSProperties } from 'react'
import type { AgentAvatarConfig, AgentItem } from '../types'

interface IProps {
	item: Pick<AgentItem, 'name' | 'photo' | 'avatar'>
	size?: 'small' | 'large'
}

const size_map = {
	small: 32,
	large: 48
} as const

const Index = (props: IProps) => {
	const { item, size = 'large' } = props

	const { openAvatarDialog } = useModel()

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

		const next_url = URL.createObjectURL(new Blob([new Uint8Array(photo)]))

		setPhotoUrl(next_url)

		return () => URL.revokeObjectURL(next_url)
	}, [photo])

	return (
		<div
			className='
				flex
				items-center justify-center
				rounded-full
				text-sm font-medium
				uppercase
				bg-secondary/50
			'
			style={wrapper_style}
			onClick={openAvatarDialog}
		>
			{photo_url ? (
				<div className='bg-secondary/40 overflow-hidden rounded-lg' style={wrapper_style}>
					<img className='h-full w-full object-cover' src={photo_url} alt={item.name} />
				</div>
			) : avatar_config?.type === 'nice' ? (
				<NiceAvatar style={wrapper_style} shape='circle' {...avatar_config.data} />
			) : avatar_config?.type === 'notion' ? (
				<NotionAvatar style={wrapper_style} shape='circle' config={avatar_config.data} />
			) : (
				item.name.slice(0, 2)
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
