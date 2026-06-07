import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { Dialog } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('linkcase')
	const editing = x.add_dialog_mode === 'edit' && Boolean(x.editing_link_id)
	const title = editing ? t('dialog.edit_title') : t('dialog.add_title')
	const desc = editing ? t('dialog.edit_desc') : t('dialog.add_desc')
	const submit_text = x.add_submit_loading
		? editing
			? t('dialog.saving')
			: t('dialog.adding')
		: editing
			? t('dialog.save')
			: t('dialog.add')

	return (
		<Dialog
			open={x.add_dialog_open}
			title={title}
			desc={desc}
			className='w-[640px]! max-w-[640px]!'
			setOpen={x.setAddDialogOpen}
		>
			<div className='flex flex-col gap-4'>
				<div className='flex flex-col gap-2'>
					<div className='text-sm font-medium'>{t('dialog.title')}</div>
					<Input
						value={x.add_title}
						placeholder={t('dialog.title_placeholder')}
						onChange={event => x.setAddTitle(event.target.value)}
					></Input>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='text-sm font-medium'>{t('dialog.link')}</div>
					<Input
						value={x.add_url}
						placeholder='https://example.com/article'
						onChange={event => x.setAddUrl(event.target.value)}
					></Input>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='flex items-center justify-between gap-3'>
						<div className='text-sm font-medium'>{t('dialog.content')}</div>
						<div className='text-std-400 text-xs'>{t('dialog.content_hint')}</div>
					</div>
					<Textarea
						className='min-h-[240px] focus-within:ring-0!'
						value={x.add_content}
						placeholder={t('dialog.content_placeholder')}
						onChange={event => x.setAddContent(event.target.value)}
					></Textarea>
				</div>
				<div
					className='
						sticky
						flex
						items-center justify-end
						gap-2
						px-1 pt-3
						mb-[-10px]
						bg-background
						-bottom-px
					'
				>
					<Button
						variant='outline'
						size='sm'
						disabled={x.add_submit_loading}
						onClick={() => x.setAddDialogOpen(false)}
					>
						{t('dialog.cancel')}
					</Button>
					<Button
						className='w-20'
						size='sm'
						disabled={x.add_submit_loading || !x.add_url.trim()}
						onClick={x.submitLinkDialog}
					>
						{submit_text}
					</Button>
				</div>
			</div>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
