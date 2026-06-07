import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/__shadcn__/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import Editor from '@/components/Editor'

import { useModel } from '../context'
import { private_article_for_types } from '../types'

const Index = () => {
	const { t } = useTranslation(['agent', 'post'])
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
					w-[720px] h-[min(88vh,750px)] max-w-[calc(100vw-32px)]!
					gap-0
				'
			>
				<DialogHeader>
					<DialogTitle>{t('private_article.title', { ns: 'agent' })}</DialogTitle>
				</DialogHeader>
				<div className='mt-6 mb-2 px-6.5'>
					<Textarea
						className='
							flex-1
							min-h-auto
							px-0 py-0
							rounded-none
							text-base! font-medium leading-6
							bg-transparent
							border-0
							focus-visible:ring-0
						'
						value={private_article_dialog_title}
						placeholder={t('private_article.untitled', { ns: 'agent' })}
						onChange={event => setPrivateArticleDialogTitle(event.target.value)}
					></Textarea>
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
							className='min-h-full px-2! text-[13px]'
							rich_text
							onChange={value => setPrivateArticleDialogContent(value)}
							onCharacterCountChange={setCharacterCount}
						></Editor>
					</div>
					<div
						className='
							flex
							items-center justify-end
							gap-4
							pt-2
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
							<span className='text-std-300 text-xs'>
								{t('private_article.characters', {
									ns: 'agent',
									count: character_count
								})}
							</span>
							<Button
								variant='outline'
								size='sm'
								disabled={private_article_dialog_loading}
								onClick={() => setPrivateArticleDialogOpen(false)}
							>
								{t('private_article.cancel', { ns: 'agent' })}
							</Button>
							<Button
								size='sm'
								disabled={
									private_article_dialog_loading ||
									!private_article_dialog_content.trim()
								}
								onClick={() => void submitPrivateArticleDialog()}
							>
								{private_article_dialog_loading ? (
									<Loader2 className='size-3 animate-spin'></Loader2>
								) : null}
								<span>
									{private_article_dialog_loading
										? t('private_article.creating', { ns: 'agent' })
										: t('private_article.create', { ns: 'agent' })}
								</span>
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
