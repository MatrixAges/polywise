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

const accept = '.jpg,.jpeg,.svg,.png,.webp,image/jpeg,image/png,image/svg+xml,image/webp'

const Index = () => {
	const {
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
			<DialogContent className='max-w-xl'>
				<DialogHeader>
					<DialogTitle>Agent Avatar</DialogTitle>
					<DialogDescription>Upload photo or generate random avatar config.</DialogDescription>
				</DialogHeader>
				<div className='flex flex-col gap-4'>
					<div className='flex gap-2'>
						<Button
							variant={avatar_mode === 'upload' ? 'default' : 'outline'}
							onClick={() => setAvatarMode('upload')}
						>
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
					<div
						className='
							flex
							items-center justify-center
							min-h-56
							rounded-2xl
							bg-secondary/20
							border border-border
						'
					>
						{avatar_mode === 'upload' && avatar_preview_url ? (
							<img
								className='h-32 w-32 rounded-2xl object-cover'
								src={avatar_preview_url}
								alt='agent avatar preview'
							/>
						) : null}
						{avatar_mode === 'nice' && pending_avatar?.type === 'nice' ? (
							<NiceAvatar
								className='rounded-2xl'
								style={{ width: 128, height: 128 }}
								shape='rounded'
								{...pending_avatar.data}
							/>
						) : null}
						{avatar_mode === 'notion' && pending_avatar?.type === 'notion' ? (
							<NotionAvatar
								className='rounded-2xl'
								style={{ width: 128, height: 128 }}
								shape='rounded'
								config={pending_avatar.data}
							/>
						) : null}
						{avatar_mode === 'upload' && !avatar_preview_url ? (
							<span className='text-std-400 text-sm'>No photo selected</span>
						) : null}
						{avatar_mode === 'nice' && pending_avatar?.type !== 'nice' ? (
							<span className='text-std-400 text-sm'>Generate a nice avatar</span>
						) : null}
						{avatar_mode === 'notion' && pending_avatar?.type !== 'notion' ? (
							<span className='text-std-400 text-sm'>Generate a notion avatar</span>
						) : null}
					</div>
					{avatar_mode === 'upload' ? (
						<div className='flex items-center gap-2'>
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
								Random Nice Config
							</Button>
						</div>
					) : null}
					{avatar_mode === 'notion' ? (
						<div className='flex items-center gap-2'>
							<Button variant='outline' onClick={onGenerateNotion}>
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
