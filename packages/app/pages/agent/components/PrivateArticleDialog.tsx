import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/__shadcn__/components/ui/dialog'
import { Input } from '@/__shadcn__/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import Editor from '@/components/Editor'

import { useModel } from '../context'
import { private_article_for_types } from '../types'

const Index = () => {
	const {
		private_article_dialog_open,
		private_article_dialog_loading,
		private_article_dialog_title,
		private_article_dialog_content,
		private_article_dialog_for,
		setPrivateArticleDialogOpen,
		setPrivateArticleDialogTitle,
		setPrivateArticleDialogContent,
		setPrivateArticleDialogFor,
		submitPrivateArticleDialog
	} = useModel()
	const [character_count, setCharacterCount] = useState(0)

	return (
		<Dialog
			open={private_article_dialog_open}
			onOpenChange={next_open => !private_article_dialog_loading && setPrivateArticleDialogOpen(next_open)}
		>
			<DialogContent
				className='
					overflow-hidden
					flex flex-col
					w-[960px] h-[min(80vh,720px)] max-w-[calc(100vw-32px)]!
					gap-0
					p-0
				'
			>
				<DialogHeader className='px-4 pt-4 pb-1'>
					<DialogTitle>New article</DialogTitle>
				</DialogHeader>
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
							value={private_article_dialog_title}
							placeholder='Untitled article'
							onChange={event => setPrivateArticleDialogTitle(event.target.value)}
						></Input>
					</div>
				</div>
				<div
					className='
						overflow-hidden
						flex flex-1 flex-col
						min-h-0
					'
				>
					<div className='min-h-0 flex-1 overflow-hidden'>
						<Editor
							id='agent-private-article-dialog'
							value={private_article_dialog_content}
							className='min-h-full px-6! pt-4.5! text-[14px]'
							rich_text
							onChange={value => setPrivateArticleDialogContent(value)}
							onCharacterCountChange={setCharacterCount}
						></Editor>
					</div>
					<div
						className='
							flex
							items-center justify-between
							h-11
							gap-4
							px-3
							border-t border-border-light
						'
					>
						<Select
							value={private_article_dialog_for}
							onValueChange={value =>
								value &&
								setPrivateArticleDialogFor(
									value as (typeof private_article_for_types)[number]
								)
							}
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
								{private_article_for_types.map(item => (
									<SelectItem value={item} key={item}>
										<span className='capitalize'>{item}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className='flex items-center gap-3'>
							<span className='text-std-300 text-xs'>{character_count} characters</span>
							<Button
								variant='outline'
								disabled={private_article_dialog_loading}
								onClick={() => setPrivateArticleDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								disabled={
									private_article_dialog_loading ||
									!private_article_dialog_content.trim()
								}
								onClick={() => void submitPrivateArticleDialog()}
							>
								{private_article_dialog_loading ? (
									<Loader2 className='size-3 animate-spin'></Loader2>
								) : null}
								<span>{private_article_dialog_loading ? 'Creating...' : 'Create'}</span>
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
