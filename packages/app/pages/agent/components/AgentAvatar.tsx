import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import NiceAvatar from 'react-nice-avatar'
import NotionAvatar from 'react-notion-avatar'

import { useModel } from '../context'

import type { CSSProperties } from 'react'
import type { AgentAvatarConfig, AgentItem } from '../types'

interface IProps {
	item: Pick<AgentItem, 'name' | 'photo' | 'avatar'>
	size?: 'small' | 'large' | number
	shape?: 'circle' | 'rounded'
	clickable?: boolean
	photo_url?: string
	avatar?: AgentAvatarConfig | null
}

const default_avatar_url = '/images/bird.jpg'

const size_map = {
	small: 36,
	large: 60
} as const

const Index = (props: IProps) => {
	const { item, size = 'large', shape = 'circle', clickable = true, photo_url = '', avatar } = props

	const { openAvatarDialog } = useModel()

	const box_size = typeof size === 'number' ? size : size_map[size]
	const avatar_config = avatar ?? (item.avatar as AgentAvatarConfig | null)
	const photo = item.photo as Uint8Array | null
	const wrapper_style = { width: box_size, height: box_size } as CSSProperties
	const is_rounded = shape === 'rounded'
	const [resolved_photo_url, setPhotoUrl] = useState(photo_url)

	useEffect(() => {
		if (photo_url) {
			setPhotoUrl(photo_url)

			return
		}

		if (!photo) {
			setPhotoUrl(avatar_config ? '' : default_avatar_url)

			return
		}

		const next_url = URL.createObjectURL(new Blob([new Uint8Array(photo)]))

		setPhotoUrl(next_url)

		return () => URL.revokeObjectURL(next_url)
	}, [avatar_config, photo, photo_url])

	return (
		<div
			className={$cx(
				`
				flex
				items-center justify-center
				text-sm font-medium
				uppercase
				bg-secondary
				outline-offset-2
			`,
				is_rounded ? 'rounded-[24px]' : 'rounded-full',
				clickable && 'clickable hover:outline-1'
			)}
			style={wrapper_style}
			onClick={clickable ? openAvatarDialog : undefined}
		>
			{resolved_photo_url ? (
				<div
					className={$cx(
						'bg-secondary/40 overflow-hidden',
						is_rounded ? 'rounded-[24px]' : 'rounded-full'
					)}
					style={wrapper_style}
				>
					<img className='h-full w-full object-cover' src={resolved_photo_url} alt={item.name} />
				</div>
			) : avatar_config?.type === 'nice' ? (
				<NiceAvatar style={wrapper_style} shape={shape} {...avatar_config.data} />
			) : avatar_config?.type === 'notion' ? (
				<NotionAvatar style={wrapper_style} shape={shape} config={avatar_config.data} />
			) : (
				item.name.slice(0, 1)
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
