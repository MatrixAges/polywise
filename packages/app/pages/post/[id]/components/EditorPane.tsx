import { Bot, Database, Loader2, Save, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { TextTabs } from '@/components'
import Editor from '@/components/Editor'

import { for_type_tab_items } from '../../utils'
import { useModel } from '../context'

import type { Editor as TiptapEditor } from '@tiptap/core'
import type { PostForType } from '../../types'

const Index = () => {
	const x = useModel()
	const navigate = useNavigate()

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
				Loading post...
			</div>
		)
	}

	return (
		<>
			<div className='border-border-light border-b px-4 py-3'>
				<div className='flex items-center gap-3'>
					<Input
						className='h-9 flex-1 text-base font-semibold'
						placeholder='Untitled post'
						value={x.draft_title}
						onChange={event => x.setDraftTitle(event.target.value)}
						onBlur={() => void x.saveCurrentPost({ silent: true })}
					></Input>
					<Button
						className='h-9'
						variant='outline'
						disabled={!x.dirty || x.saving}
						onClick={() => void x.saveCurrentPost()}
					>
						{x.saving ? (
							<Loader2 className='size-4 animate-spin'></Loader2>
						) : (
							<Save className='size-4'></Save>
						)}
						<span>{x.saving ? 'Saving' : 'Save'}</span>
					</Button>
					<Button
						className='h-9'
						variant='outline'
						disabled={x.extracting || x.post_loading}
						onClick={() => void x.extractPost()}
					>
						{x.extracting ? (
							<Loader2 className='size-4 animate-spin'></Loader2>
						) : (
							<Database className='size-4'></Database>
						)}
						<span>{x.selected_post.is_pipelined ? 'Re-extract' : 'Extract'}</span>
					</Button>
					<Button
						className='h-9'
						variant='outline'
						disabled={x.saving || x.extracting}
						onClick={async () => {
							if (await x.deletePost()) {
								navigate('/post')
							}
						}}
					>
						<Trash2 className='size-4'></Trash2>
						<span>Delete</span>
					</Button>
				</div>
				<div
					className='
						flex
						items-center justify-between
						gap-4
						mt-3
					'
				>
					<div className='h-7'>
						<TextTabs
							items={for_type_tab_items.map(item => ({
								key: item.key,
								title: item.title,
								Icon: item.Icon
							}))}
							active={x.draft_for_type}
							setActive={(value: PostForType) => x.setDraftForType(value)}
						></TextTabs>
					</div>
					<div className='text-std-400 text-xs'>{x.dirty ? 'Unsaved changes' : 'Saved'}</div>
				</div>
			</div>
			<div className='min-h-0 flex-1 overflow-hidden' ref={x.setEditorArea}>
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
						Loading post...
					</div>
				) : (
					<Editor
						id={x.selected_post.id}
						value={x.draft_content}
						className='min-h-full px-5 py-4'
						rich_text
						onChange={value => x.setDraftContent(value)}
						onBlur={() => void x.saveCurrentPost({ silent: true })}
						renderActionBarExtra={({ editor }) => (
							<div
								className='
										flex
										items-center
										gap-1
										px-2
										btn_format cursor-pointer
									'
								onClick={() =>
									void x.addReferenceToPostSessionInput(editor as TiptapEditor)
								}
								title='Add reference to post session'
							>
								<Bot className='size-3.5'></Bot>
								<span className='text-xs font-medium'>Add Reference</span>
							</div>
						)}
					></Editor>
				)}
			</div>
		</>
	)
}

export default observer(Index)
