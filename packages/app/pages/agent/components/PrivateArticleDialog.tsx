import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/__shadcn__/components/ui/dialog'
import { Input } from '@/__shadcn__/components/ui/input'
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import { useModel } from '../context'

const Index = () => {
	const {
		article_for,
		private_article_dialog_open,
		private_article_dialog_loading,
		private_article_dialog_title,
		private_article_dialog_content,
		setPrivateArticleDialogOpen,
		setPrivateArticleDialogTitle,
		setPrivateArticleDialogContent,
		submitPrivateArticleDialog
	} = useModel()

	return (
		<Dialog
			open={private_article_dialog_open}
			onOpenChange={next_open => !private_article_dialog_loading && setPrivateArticleDialogOpen(next_open)}
		>
			<DialogContent className='w-[720px] max-w-[calc(100vw-32px)]!'>
				<div className='flex max-h-[min(80vh,720px)] flex-col'>
					<DialogHeader>
						<DialogTitle>New {article_for} article</DialogTitle>
					</DialogHeader>
					<div
						className='
							overflow-y-auto
							flex flex-1 flex-col
							min-h-0
							gap-4
							py-2
						'
					>
						<div className='flex flex-col gap-2'>
							<div className='text-sm font-medium'>Title</div>
							<Input
								value={private_article_dialog_title}
								placeholder='Optional'
								onChange={event => setPrivateArticleDialogTitle(event.target.value)}
							></Input>
						</div>
						<div
							className='
								flex flex-1 flex-col
								min-h-0
								gap-2
							'
						>
							<div className='text-sm font-medium'>Content</div>
							<Textarea
								className='min-h-[320px] resize-y'
								value={private_article_dialog_content}
								placeholder='Write article content here'
								onChange={event => setPrivateArticleDialogContent(event.target.value)}
								onKeyDown={event => {
									if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
										event.preventDefault()
										void submitPrivateArticleDialog()
									}
								}}
							></Textarea>
						</div>
					</div>
					<DialogFooter className='pt-4'>
						<Button
							variant='outline'
							disabled={private_article_dialog_loading}
							onClick={() => setPrivateArticleDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							disabled={
								private_article_dialog_loading || !private_article_dialog_content.trim()
							}
							onClick={() => void submitPrivateArticleDialog()}
						>
							{private_article_dialog_loading ? 'Creating...' : 'Create'}
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
