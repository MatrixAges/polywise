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
				flex
				items-center
				gap-2
				px-3 py-2
				bg-secondary/20
				border-b border-border-light
			'
		>
			<div className='text-std-400 min-w-0 flex-1 text-xs'>
				{x.has_checked_items ? `${x.checked_count} selected` : 'Select links for batch actions'}
			</div>
			<Button variant='ghost' size='xs' onClick={x.toggleCheckAllLoadedLinks}>
				{x.all_loaded_checked ? 'Unselect all' : 'Select all'}
			</Button>
			{x.has_checked_items && (
				<>
					<Button
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
					<Button
						variant='destructive'
						size='xs'
						disabled={x.selection_remove_loading}
						onClick={() => void x.removeCheckedLinks()}
					>
						{x.selection_remove_loading ? 'Removing' : 'Delete'}
					</Button>
					<Button variant='ghost' size='xs' onClick={x.clearCheckedLinks}>
						Clear
					</Button>
				</>
			)}
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
