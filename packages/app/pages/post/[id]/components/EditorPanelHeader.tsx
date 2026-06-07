import { Database, Loader2, MessageCircleCheck, Save } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Input } from '@/__shadcn__/components/ui/input'

import { useModel } from '../context'

const EditorPanelHeader = () => {
	const x = useModel()
	const { t } = useTranslation('post')

	return (
		<div className='h-9 px-3'>
			<div className='flex items-center gap-2'>
				<Input
					className='
						flex-1
						px-0
						rounded-none
						text-xsm! font-medium
						bg-transparent
						focus:bg-transparent
					'
					placeholder={t('detail.untitled_post')}
					value={x.draft_title}
					onChange={event => x.setDraftTitle(event.target.value)}
					onBlur={() => void x.saveCurrentPost({ silent: true })}
				></Input>
				<button
					className={$cx('icon_button small', x.session_panel_open && 'text-std-800!')}
					title={t('detail.toggle_session_panel')}
					onClick={() => x.toggleSessionPanel()}
				>
					<MessageCircleCheck className='size-3'></MessageCircleCheck>
				</button>
				<button
					className='icon_button small text-std-800!'
					disabled={x.extracting || x.post_loading}
					onClick={() => x.extractPost()}
				>
					{x.extracting ? (
						<Loader2 className='size-3 animate-spin'></Loader2>
					) : (
						<Database className='size-3'></Database>
					)}
				</button>
				<button
					className='icon_button small text-std-800!'
					disabled={!x.dirty || x.saving}
					onClick={() => x.saveCurrentPost()}
				>
					{x.saving ? (
						<Loader2 className='size-3 animate-spin'></Loader2>
					) : (
						<Save className='size-3'></Save>
					)}
				</button>
			</div>
		</div>
	)
}

export default observer(EditorPanelHeader)
