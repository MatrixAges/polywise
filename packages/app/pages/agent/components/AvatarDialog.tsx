import { Layers2, RefreshCw, Sparkles, Upload } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { genConfig } from 'react-nice-avatar'
import { getRandomConfig } from 'react-notion-avatar'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog, DialogFooter, TextTabs } from '@/components'
import { uploadFile } from '@/utils'

import { useModel } from '../context'
import AgentAvatar from './AgentAvatar'

const accept = '.jpg,.jpeg,.svg,.png,.webp,image/jpeg,image/png,image/svg+xml,image/webp'

const Index = () => {
	const { t } = useTranslation('agent')
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

	const avatar_mode_items = [
		{ key: 'upload', title: t('avatar.upload'), Icon: Upload },
		{ key: 'nice', title: t('avatar.colorful'), Icon: Sparkles },
		{ key: 'notion', title: t('avatar.notion'), Icon: Layers2 }
	] as const

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
			title={t('avatar.title')}
			desc={t('avatar.desc')}
			className='w-[360px]'
			setOpen={open => (!open ? closeAvatarDialog() : undefined)}
		>
			<div className='flex flex-col items-center gap-5'>
				<div
					className='
						flex
						w-full h-8
						border-b border-border-light
					'
				>
					<TextTabs
						className='w-full justify-around'
						itemClassName='h-8 px-2 text-sm'
						items={[...avatar_mode_items]}
						active={avatar_mode}
						setActive={setAvatarMode}
					></TextTabs>
				</div>
				<div className='flex items-center justify-center pt-3'>
					<AgentAvatar
						item={selected_agent}
						size={112}
						shape='circle'
						clickable={false}
						photo_url={avatar_preview_url}
						avatar={pending_avatar}
					></AgentAvatar>
				</div>
				{avatar_mode === 'upload' && (
					<div className='flex flex-col items-center gap-3'>
						<div className='flex gap-2'>
							<Button variant='outline' onClick={onUpload}>
								{t('avatar.choose_file')}
							</Button>
							<Button variant='outline' onClick={clearAvatarPhoto}>
								{t('avatar.clear_photo')}
							</Button>
						</div>
					</div>
				)}
				{avatar_mode === 'nice' && (
					<div className='flex items-center gap-2'>
						<Button variant='outline' onClick={onGenerateNice}>
							<RefreshCw className='size-3.5'></RefreshCw>
							{t('avatar.random_nice')}
						</Button>
					</div>
				)}
				{avatar_mode === 'notion' && (
					<div className='flex items-center gap-2'>
						<Button variant='outline' onClick={onGenerateNotion}>
							<RefreshCw className='size-3.5'></RefreshCw>
							{t('avatar.random_notion')}
						</Button>
					</div>
				)}
			</div>
			<DialogFooter className='mt-6'>
				<Button variant='outline' onClick={closeAvatarDialog}>
					{t('avatar.cancel')}
				</Button>
				<Button onClick={submitAvatar}>{t('avatar.save')}</Button>
			</DialogFooter>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
