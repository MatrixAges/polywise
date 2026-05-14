import { ArrowDownToLine, Loader, RefreshCw, TriangleAlert } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog } from '@/components'

import { useModel } from '../context'

const status_badge_class_name = 'rounded-full px-2 py-0.5 text-[11px] font-medium'

const Index = () => {
	const x = useModel()

	return (
		<Dialog
			open={x.sniffer_dialog_open}
			title='Import Browser Bookmarks'
			desc='Import bookmarks from local Chrome, Firefox, or Edge profiles. Each browser runs separately and duplicate links are ignored by normalized hash.'
			className='w-[680px]'
			setOpen={x.setSnifferDialogOpen}
		>
			<div className='flex flex-col gap-4'>
				<div className='flex items-center justify-between gap-3'>
					<div className='text-std-400 text-sm'>
						Choose one browser at a time. There is no combined import action here.
					</div>
					<Button
						variant='outline'
						size='sm'
						disabled={x.sniffer_status_loading}
						onClick={() => void x.loadSnifferStatus()}
					>
						{x.sniffer_status_loading ? (
							<Loader className='size-3.5 animate-spin'></Loader>
						) : (
							<RefreshCw className='size-3.5'></RefreshCw>
						)}
						<span>Refresh Status</span>
					</Button>
				</div>
				<div className='flex flex-col gap-3'>
					{x.sniffer_statuses.map(browser => {
						const importing = x.sniffer_importing_browser === browser.id

						return (
							<div
								className='
								flex
								items-center justify-between
								gap-4
								p-4
								rounded-3xl
								bg-secondary/20
								border border-border-light
							'
								key={browser.id}
							>
								<div className='min-w-0 flex-1'>
									<div className='flex items-center gap-2'>
										<div className='text-sm font-semibold'>{browser.name}</div>
										<div
											className={$cx(
												status_badge_class_name,
												browser.available
													? 'bg-emerald-100 text-emerald-700'
													: 'bg-slate-100 text-slate-600'
											)}
										>
											{browser.available ? 'ready' : 'unavailable'}
										</div>
									</div>
									<div className='text-std-400 mt-1 text-sm'>{browser.message}</div>
									<div className='text-std-300 mt-2 text-xs'>
										Detected profile sources: {browser.source_count}
									</div>
								</div>
								<Button
									size='sm'
									disabled={
										!browser.available ||
										importing ||
										Boolean(x.sniffer_importing_browser)
									}
									onClick={() => void x.importBrowserBookmarks(browser.id)}
								>
									{importing ? (
										<Loader className='size-3.5 animate-spin'></Loader>
									) : (
										<ArrowDownToLine className='size-3.5'></ArrowDownToLine>
									)}
									<span>{importing ? 'Importing' : `Import ${browser.name}`}</span>
								</Button>
							</div>
						)
					})}
					{!x.sniffer_status_loading && x.sniffer_statuses.length === 0 && (
						<div
							className='
								flex flex-col
								items-center justify-center
								gap-2
								px-6 py-10
								rounded-3xl
								text-sm text-std-300
								border border-dashed border-border-light
							'
						>
							<TriangleAlert className='size-4'></TriangleAlert>
							<span>No browser status available yet</span>
						</div>
					)}
				</div>
			</div>
		</Dialog>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
