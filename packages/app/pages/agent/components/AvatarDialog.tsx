import { RefreshCw, Upload } from 'lucide-react'
import NiceAvatar, { genConfig } from 'react-nice-avatar'
import NotionAvatar, { getRandomConfig } from 'react-notion-avatar'

import { Button } from '@/__shadcn__/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/__shadcn__/components/ui/dialog'
import { uploadFile } from '@/utils'

import { useModel } from '../context'
import AgentAvatar from './AgentAvatar'

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
				w-28 h-28
				rounded-[24px]
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
		<Dialog open={avatar_dialog_open} onOpenChange={open => (!open ? closeAvatarDialog() : undefined)}>
			<DialogContent className='max-w-3xl'>
				<DialogHeader>
					<DialogTitle>Agent Avatar</DialogTitle>
					<DialogDescription>
						Edit the current avatar, upload a photo, or generate a new look.
					</DialogDescription>
				</DialogHeader>
				<div className='flex flex-col gap-5'>
					<div className='grid gap-4 md:grid-cols-[0.92fr_1.08fr]'>
						<div
							className='
								p-4
								rounded-[28px]
								bg-card
								border border-border-light
							'
						>
							<div
								className='
									text-std-400 text-xs font-medium tracking-[0.16em]
									uppercase
								'
							>
								Current avatar
							</div>
							<div
								className='
									flex flex-col
									items-center justify-center
									min-h-56
									gap-3
									mt-4
									rounded-[24px]
									bg-secondary/15
									border border-dashed border-border-light
								'
							>
								<AgentAvatar item={selected_agent} size='large'></AgentAvatar>
								<div className='text-center'>
									<div className='text-sm font-medium'>{selected_agent.name}</div>
									<div className='text-std-400 text-xs'>Saved on this agent</div>
								</div>
							</div>
						</div>
						<div
							className='
								p-4
								rounded-[28px]
								bg-card
								border border-border-light
							'
						>
							<div
								className='
									text-std-400 text-xs font-medium tracking-[0.16em]
									uppercase
								'
							>
								New avatar
							</div>
							<div
								className='
									flex
									items-center justify-center
									min-h-56
									mt-4
									rounded-[24px]
									bg-secondary/15
									border border-border-light
								'
							>
								<AvatarPreview
									name={selected_agent.name}
									photo_url={avatar_preview_url}
									avatar={pending_avatar}
								></AvatarPreview>
							</div>
							<div className='text-std-400 mt-3 text-xs'>
								{avatar_mode === 'upload'
									? avatar_file_name ||
										'Upload a new image to replace the current avatar.'
									: avatar_mode === 'nice'
										? 'Generate another rounded nice avatar until it feels right.'
										: 'Generate another notion avatar and save when ready.'}
							</div>
						</div>
					</div>
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
				<DialogFooter>
					<Button variant='outline' onClick={closeAvatarDialog}>
						Cancel
					</Button>
					<Button onClick={submitAvatar}>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default $app.memo(Index)
