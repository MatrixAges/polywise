import { useEffect, useMemo } from 'react'
import NiceAvatar from 'react-nice-avatar'
import NotionAvatar from 'react-notion-avatar'

import type { CSSProperties } from 'react'

interface IProps {
	name: string
	photo?: Uint8Array | null
	avatar?: unknown
	size?: number
	shape?: 'circle' | 'rounded'
}

const default_avatar_url = '/images/bird.jpg'

const Index = ({ name, photo, avatar, size = 36, shape = 'rounded' }: IProps) => {
	const wrapper_style = { width: size, height: size } as CSSProperties
	const is_rounded = shape === 'rounded'
	const avatar_config =
		avatar && typeof avatar === 'object' && 'type' in avatar ? (avatar as Record<string, unknown>) : null
	const object_photo_url = useMemo(() => {
		if (!photo) {
			return ''
		}

		return URL.createObjectURL(new Blob([new Uint8Array(photo)]))
	}, [photo])
	const resolved_photo_url = object_photo_url || (avatar_config ? '' : default_avatar_url)

	useEffect(() => {
		if (!object_photo_url) {
			return
		}

		return () => URL.revokeObjectURL(object_photo_url)
	}, [object_photo_url])

	if (resolved_photo_url) {
		return (
			<div
				className={$cx('bg-secondary/40 overflow-hidden', is_rounded ? 'rounded-2xl' : 'rounded-full')}
				style={wrapper_style}
			>
				<img className='h-full w-full object-cover' src={resolved_photo_url} alt={name} />
			</div>
		)
	}

	if (avatar_config?.type === 'nice' && avatar_config.data && typeof avatar_config.data === 'object') {
		return (
			<NiceAvatar
				style={wrapper_style}
				shape={shape}
				{...(avatar_config.data as Record<string, unknown>)}
			/>
		)
	}

	if (avatar_config?.type === 'notion' && avatar_config.data && typeof avatar_config.data === 'object') {
		return <NotionAvatar style={wrapper_style} shape={shape} config={avatar_config.data as never} />
	}

	return (
		<div
			className={$cx(
				`
				flex
				items-center justify-center
				text-sm font-medium
				uppercase
				bg-secondary
			`,
				is_rounded ? 'rounded-2xl' : 'rounded-full'
			)}
			style={wrapper_style}
		>
			{name.slice(0, 1)}
		</div>
	)
}

export default $app.memo(Index)
