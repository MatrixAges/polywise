import { useEffect, useMemo } from 'react'
import { Upload, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getPublicAssetUrl } from '@/utils'

import type { CSSProperties, MouseEvent } from 'react'
import type { GroupItem } from '../types'

interface IProps {
	item: Pick<GroupItem, 'name' | 'photo'>
	size?: 'small' | 'large' | number
	shape?: 'circle' | 'rounded'
	photo_url?: string
	onUpload?: () => void | Promise<void>
	onClear?: () => void | Promise<void>
	disabled?: boolean
}

const default_avatar_url = getPublicAssetUrl('/images/bird.jpg')

const size_map = {
	small: 36,
	large: 60
} as const

const Index = ({
	item,
	size = 'large',
	shape = 'circle',
	photo_url = '',
	onUpload,
	onClear,
	disabled = false
}: IProps) => {
	const { t } = useTranslation('agent')
	const box_size = typeof size === 'number' ? size : size_map[size]
	const photo = item.photo as Uint8Array | null
	const wrapper_style = { width: box_size, height: box_size } as CSSProperties
	const is_rounded = shape === 'rounded'
	const editable = Boolean(onUpload || onClear)
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

	const has_custom_photo = Boolean(photo_url || photo)
	const stopPropagation = (event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()

	return (
		<div
			className={$cx(
				'group bg-secondary/40 relative overflow-hidden',
				is_rounded ? 'rounded-[24px]' : 'rounded-full'
			)}
			style={wrapper_style}
		>
			<img className='h-full w-full object-cover' src={resolved_photo_url} alt={item.name || 'Group'} />
			{editable && (
				<div
					className={`
						absolute
						inset-0
						flex
						items-center justify-center
						gap-2
						bg-black/45
						opacity-0
						transition-opacity
						group-hover:opacity-100
					`}
				>
					{onUpload && (
						<button
							className='icon_button small'
							type='button'
							title={t('avatar.upload_photo')}
							disabled={disabled}
							onClick={(event: MouseEvent<HTMLButtonElement>) => {
								stopPropagation(event)
								void onUpload()
							}}
						>
							<Upload className='size-3.5'></Upload>
						</button>
					)}
					{onClear && (
						<button
							className='icon_button small'
							type='button'
							title={t('avatar.clear_photo_title')}
							disabled={disabled || !has_custom_photo}
							onClick={(event: MouseEvent<HTMLButtonElement>) => {
								stopPropagation(event)
								void onClear()
							}}
						>
							<X className='size-3.5'></X>
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)
