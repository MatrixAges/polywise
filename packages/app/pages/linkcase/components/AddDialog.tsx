import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { Dialog } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<Dialog
			open={x.add_dialog_open}
			title='Add Link'
			desc='Create a Linkcase entry manually. Favicon is fetched from the website automatically.'
			className='w-[560px]'
			setOpen={x.setAddDialogOpen}
		>
			<div className='flex flex-col gap-4'>
				<div className='flex flex-col gap-2'>
					<div className='text-sm font-medium'>Title</div>
					<Input
						value={x.add_title}
						placeholder='Optional. Defaults to the link URL.'
						onChange={event => x.setAddTitle(event.target.value)}
					></Input>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='text-sm font-medium'>Link</div>
					<Input
						value={x.add_url}
						placeholder='https://example.com/article'
						onChange={event => x.setAddUrl(event.target.value)}
					></Input>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='flex items-center justify-between gap-3'>
						<div className='text-sm font-medium'>Content</div>
						<div className='text-std-400 text-xs'>
							Optional. Paste cleaned main content directly.
						</div>
					</div>
					<Textarea
						className='min-h-[240px]'
						value={x.add_content}
						placeholder='If you already have the main body content, paste it here. Leave empty to add the link only.'
						onChange={event => x.setAddContent(event.target.value)}
					></Textarea>
				</div>
				<div
					className='
						flex
						items-center justify-end
						gap-2
						pt-2
					'
				>
					<Button
						variant='ghost'
						size='sm'
						disabled={x.add_submit_loading}
						onClick={() => x.setAddDialogOpen(false)}
					>
						Cancel
					</Button>
					<Button
						size='sm'
						disabled={x.add_submit_loading || !x.add_url.trim()}
						onClick={x.submitAddLink}
					>
						{x.add_submit_loading ? 'Adding...' : 'Add'}
					</Button>
				</div>
			</div>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
