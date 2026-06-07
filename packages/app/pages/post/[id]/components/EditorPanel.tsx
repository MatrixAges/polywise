import { Fragment, useState } from 'react'
import { SparkleIcon } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import Editor from '@/components/Editor'

import { useModel } from '../context'
import EditorPanelFooter from './EditorPanelFooter'
import EditorPanelHeader from './EditorPanelHeader'

import type { Editor as TiptapEditor } from '@tiptap/core'

const EditorPanel = () => {
	const x = useModel()
	const { t } = useTranslation('post')
	const [character_count, setCharacterCount] = useState(0)

	if (!x.selected_post) {
		return (
			<div
				className='
					flex
					items-center justify-center
					h-full
					text-sm text-std-400
				'
			>
				{t('detail.loading_post_detail')}
			</div>
		)
	}

	return (
		<Fragment>
			<EditorPanelHeader></EditorPanelHeader>
			<div
				className='
					overflow-hidden
					flex flex-1 flex-col
					min-h-0
				'
				ref={x.setEditorArea}
			>
				<div className='min-h-0 flex-1 overflow-hidden'>
					{x.post_loading ? (
						<div
							className='
								flex
								items-center justify-center
								h-full
								text-sm text-std-400
							'
						>
							<Loader2 className='mr-2 size-4 animate-spin'></Loader2>
							{t('detail.loading_post_detail')}
						</div>
					) : (
						<Editor
							id={x.selected_post.id}
							value={x.draft_content}
							className='min-h-full px-6! pt-4.5! text-[14px]'
							rich_text
							onChange={value => x.setDraftContent(value)}
							onCharacterCountChange={setCharacterCount}
							onBlur={() => void x.saveCurrentPost({ silent: true })}
							renderActionBarExtra={({ editor }) => (
								<div
									className='
											flex
											items-center justify-center
											w-[32px] h-full
										'
									onClick={() =>
										x.addReferenceToPostSessionInput(editor as TiptapEditor)
									}
									title={t('detail.add_reference', {
										defaultValue: 'Add Reference'
									})}
								>
									<SparkleIcon className='size-3.5' weight='bold'></SparkleIcon>
								</div>
							)}
						></Editor>
					)}
				</div>
				<EditorPanelFooter character_count={character_count}></EditorPanelFooter>
			</div>
		</Fragment>
	)
}

export default observer(EditorPanel)
