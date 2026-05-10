import { RefreshCw, Upload } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import NiceAvatar, { genConfig } from 'react-nice-avatar'
import NotionAvatar, { getRandomConfig } from 'react-notion-avatar'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog, DialogFooter } from '@/components'
import { uploadFile } from '@/utils'

import { useModel } from '../context'

import type { AgentAvatarConfig } from '../types'

const accept = '.jpg,.jpeg,.svg,.png,.webp,image/jpeg,image/png,image/svg+xml,image/webp'

const AvatarPreview = (props: { name: string; photo_url: string; avatar: AgentAvatarConfig | null }) => {
	const { name, photo_url, avatar } = props

	if (photo_url) {
		return <img className='h-28 w-28 rounded-[24px] object-cover' src={photo_url} alt={`${name} preview`} />
	}

	if (avatar?.type === 'nice') {
		return (
			<NiceAvatar
				className='rounded-[24px]'
				style={{ width: 112, height: 112 }}
				shape='rounded'
				{...avatar.data}
			/>
		)
	}

	if (avatar?.type === 'notion') {
		return (
			<NotionAvatar
				className='rounded-[24px]'
				style={{ width: 112, height: 112 }}
				shape='rounded'
				config={avatar.data}
			/>
		)
	}

	return (
		<div
			className='
				flex
				items-center justify-center
				w-24 h-24
				rounded-full
				text-xl font-medium
				uppercase
				bg-secondary/50
			'
		>
			{name.slice(0, 1) || 'A'}
		</div>
	)
}

const Index = () => {
	const {
		selected_agent,
		avatar_dialog_open,
		avatar_mode,
		avatar_preview_url,
		avatar_file_name,
		pending_avatar,
		closeAvatarDialog,
		setAvatarMode,
		setPendingPhoto,
		setPendingAvatar,
		clearAvatarPhoto,
		submitAvatar
	} = useModel()

	if (!selected_agent) {
		return null
	}

	const onUpload = async () => {
		const file = (await uploadFile({ max_count: 1, accept })) as File | false

		if (!file) {
			return
		}

		if (!(file instanceof File)) {
			return
		}

		const array_buffer = await file.arrayBuffer()
		const preview_url = URL.createObjectURL(file)

		setPendingPhoto({ photo: new Uint8Array(array_buffer), file_name: file.name, preview_url })
	}

	const onGenerateNice = () => {
		setPendingAvatar({ type: 'nice', data: genConfig() })
	}

	const onGenerateNotion = () => {
		setPendingAvatar({ type: 'notion', data: getRandomConfig() })
	}

	return (
		<Dialog
			open={avatar_dialog_open}
			maxHeight='max-h-[80vh]'
			title='Agent Avatar'
			desc='Edit avatar, upload a photo, or generate a new look.'
			className='w-[360px]'
			setOpen={open => (!open ? closeAvatarDialog() : undefined)}
		>
			<div className='flex flex-col items-center gap-5'>
				<AvatarPreview
					name={selected_agent.name}
					photo_url={avatar_preview_url}
					avatar={pending_avatar}
				></AvatarPreview>
				<div className='flex flex-wrap gap-2'>
					<Button
						variant={avatar_mode === 'upload' ? 'default' : 'outline'}
						onClick={() => setAvatarMode('upload')}
					>
						<Upload className='size-3.5'></Upload>
						Upload Photo
					</Button>
					<Button
						variant={avatar_mode === 'nice' ? 'default' : 'outline'}
						onClick={() => setAvatarMode('nice')}
					>
						Nice Avatar
					</Button>
					<Button
						variant={avatar_mode === 'notion' ? 'default' : 'outline'}
						onClick={() => setAvatarMode('notion')}
					>
						Notion Avatar
					</Button>
				</div>
				{avatar_mode === 'upload' ? (
					<div className='flex flex-wrap items-center gap-2'>
						<Button variant='outline' onClick={onUpload}>
							Choose File
						</Button>
						<Button variant='outline' onClick={clearAvatarPhoto}>
							Clear Photo
						</Button>
						<span className='text-std-400 text-xs'>
							{avatar_file_name || 'jpg, svg, png, webp'}
						</span>
					</div>
				) : null}
				{avatar_mode === 'nice' ? (
					<div className='flex items-center gap-2'>
						<Button variant='outline' onClick={onGenerateNice}>
							<RefreshCw className='size-3.5'></RefreshCw>
							Random Nice Config
						</Button>
					</div>
				) : null}
				{avatar_mode === 'notion' ? (
					<div className='flex items-center gap-2'>
						<Button variant='outline' onClick={onGenerateNotion}>
							<RefreshCw className='size-3.5'></RefreshCw>
							Random Notion Config
						</Button>
					</div>
				) : null}
			</div>
			<DialogFooter className='mt-4'>
				<Button variant='outline' onClick={closeAvatarDialog}>
					Cancel
				</Button>
				<Button onClick={submitAvatar}>Save</Button>
			</DialogFooter>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
