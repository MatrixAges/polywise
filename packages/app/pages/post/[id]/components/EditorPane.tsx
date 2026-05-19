import { Fragment, useState } from 'react'
import { SparkleIcon } from '@phosphor-icons/react'
import { Database, Loader2, MessageCircleCheck, Save } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Input } from '@/__shadcn__/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import Editor from '@/components/Editor'
import { fromNow } from '@/utils'

import { post_for_types } from '../../utils'
import { useModel } from '../context'

import type { Editor as TiptapEditor } from '@tiptap/core'
import type { PostForType } from '../../types'

const Index = () => {
	const x = useModel()
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
				Loading post...
			</div>
		)
	}

	return (
		<Fragment>
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
						placeholder='Untitled post'
						value={x.draft_title}
						onChange={event => x.setDraftTitle(event.target.value)}
						onBlur={() => x.saveCurrentPost({ silent: true })}
					></Input>
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
					<button
						className={$cx('icon_button small', x.session_panel_open && 'text-std-800!')}
						title='Toggle session panel'
						onClick={() => x.toggleSessionPanel()}
					>
						<MessageCircleCheck className='size-3'></MessageCircleCheck>
					</button>
				</div>
			</div>
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
							Loading post...
						</div>
					) : (
						<Editor
							id={x.selected_post.id}
							value={x.draft_content}
							className='min-h-full px-6! pt-4.5!'
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
									title='Add Reference'
								>
									<SparkleIcon className='size-3.5' weight='bold'></SparkleIcon>
								</div>
							)}
						></Editor>
					)}
				</div>
				<div
					className='
						flex
						items-center justify-between
						h-7
						gap-4
						px-3
						text-std-300 text-xs
					'
				>
					<div className='flex items-center gap-3'>
						<Select
							value={x.draft_for_type}
							onValueChange={value => value && x.setDraftForType(value as PostForType)}
						>
							<SelectTrigger
								className='
									min-w-0
									gap-0
									text-xs text-std-300
									capitalize
								'
								noStyle
								noActiveStyle
							>
								<SelectValue className='capitalize' />
							</SelectTrigger>
							<SelectContent align='start'>
								{post_for_types.map(item => (
									<SelectItem value={item} key={item}>
										<span className='capitalize'>{item}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div>Updated {fromNow(x.selected_post.updated_at)}</div>
					</div>
					<div className='flex items-center gap-3'>
						<span>{x.dirty ? 'Unsaved changes' : 'Saved'}</span>
						<span>{character_count} characters</span>
					</div>
				</div>
			</div>
		</Fragment>
	)
}

export default observer(Index)
