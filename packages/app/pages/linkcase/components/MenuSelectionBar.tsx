import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	if (!x.select_mode || (!x.has_checked_items && x.items.length === 0)) {
		return null
	}

	return (
		<div
			className='
				flex flex-col
				gap-2
				px-2 py-2
				bg-secondary/20
				border-b border-border-light
			'
		>
			<div
				className='
					flex
					items-center justify-between
					text-std-400 text-xs
				'
			>
				{x.has_checked_items ? `${x.checked_count} selected` : 'Select links'}
				<Button variant='ghost' size='xs' onClick={x.toggleCheckAllLoadedLinks}>
					{x.all_loaded_checked ? 'Unselect all' : 'Select all'}
				</Button>
			</div>
			{x.has_checked_items && (
				<div className='flex justify-between gap-1.5'>
					<Button
						className='flex-1'
						variant='outline'
						size='xs'
						disabled={
							x.selection_fetch_submit_loading ||
							x.batch_submit_loading ||
							x.linkcase_session_running
						}
						onClick={() => void x.fetchCheckedLinks()}
					>
						{x.selection_fetch_submit_loading ? 'Submitting' : 'Fetch'}
					</Button>
					<Button className='flex-1' variant='outline' size='xs' onClick={x.clearCheckedLinks}>
						Clear
					</Button>
					<Button
						className='flex-1'
						variant='destructive'
						size='xs'
						disabled={x.selection_remove_loading}
						onClick={() => void x.removeCheckedLinks()}
					>
						{x.selection_remove_loading ? 'Removing' : 'Delete'}
					</Button>
				</div>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
