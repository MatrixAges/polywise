import { ArrowDownToLine, ChevronDown, ChevronRight, Loader, RefreshCw, TriangleAlert } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog } from '@/components'

import { useModel } from '../context'
import { getLinkcaseSnifferBrowserFolderKeys, getLinkcaseSnifferFolderKeys } from '../types'

import type {
	LinkcaseSnifferBrowserId,
	LinkcaseSnifferBrowserStatus,
	LinkcaseSnifferFolderNode,
	LinkcaseSnifferSourceStatus
} from '../types'

const status_badge_class_name = 'rounded-full px-2 py-0.5 text-[11px] font-medium'

const FolderNode = observer(
	(props: { browser: LinkcaseSnifferBrowserId; node: LinkcaseSnifferFolderNode; depth?: number }) => {
		const { browser, node, depth = 0 } = props
		const x = useModel()
		const folder_keys = getLinkcaseSnifferFolderKeys([node])
		const selection_state = x.getSnifferFolderSelectionState(browser, folder_keys)

		return (
			<div className='flex flex-col gap-1'>
				<label
					className='
					flex
					items-start
					gap-3
					px-2 py-1.5
					rounded-2xl
					transition-colors
					hover:bg-secondary/40
				'
					style={{ paddingLeft: `${depth * 16 + 8}px` }}
				>
					<input
						className='
						shrink-0
						size-4
						mt-0.5
						rounded
						border border-border-light
						accent-foreground
					'
						type='checkbox'
						checked={selection_state === 'checked'}
						ref={element => {
							if (element) {
								element.indeterminate = selection_state === 'indeterminate'
							}
						}}
						onChange={event =>
							x.toggleSnifferFolderKeys(browser, folder_keys, event.target.checked)
						}
					/>
					<div className='min-w-0 flex-1'>
						<div className='truncate text-sm font-medium'>{node.name}</div>
						<div className='text-std-400 truncate text-xs'>{node.path}</div>
					</div>
					<div className='text-std-300 shrink-0 text-xs'>{node.bookmark_count}</div>
				</label>
				{node.children.length > 0 && (
					<div className='flex flex-col gap-1'>
						{node.children.map(child => (
							<FolderNode
								browser={browser}
								node={child}
								depth={depth + 1}
								key={child.key}
							></FolderNode>
						))}
					</div>
				)}
			</div>
		)
	}
)

const SourceSection = observer((props: { browser: LinkcaseSnifferBrowserId; source: LinkcaseSnifferSourceStatus }) => {
	const { browser, source } = props

	return (
		<div
			className='
				flex flex-col
				gap-3
				p-3
				rounded-3xl
				bg-background/70
				border border-border-light
			'
		>
			<div className='flex items-center justify-between gap-3'>
				<div className='min-w-0'>
					<div className='truncate text-sm font-semibold'>{source.profile_name}</div>
					<div className='text-std-400 truncate text-xs'>{source.path}</div>
				</div>
				<div className='text-std-300 shrink-0 text-xs'>{source.bookmark_count} bookmarks</div>
			</div>
			{source.error ? (
				<div
					className='
						px-3 py-2
						rounded-2xl
						text-sm text-rose-700
						bg-rose-50
					'
				>
					{source.error}
				</div>
			) : source.folders.length > 0 ? (
				<div className='flex flex-col gap-1'>
					{source.folders.map(folder => (
						<FolderNode browser={browser} node={folder} key={folder.key}></FolderNode>
					))}
				</div>
			) : (
				<div
					className='
							px-3 py-2
							rounded-2xl
							text-std-300 text-sm
							bg-secondary/30
						'
				>
					No bookmark folders with importable links were found in this profile.
				</div>
			)}
		</div>
	)
})

const BrowserCard = observer((props: { browser: LinkcaseSnifferBrowserStatus }) => {
	const { browser } = props
	const x = useModel()
	const importing = x.sniffer_importing_browser === browser.id
	const expanded = x.isSnifferBrowserExpanded(browser.id)
	const folder_keys = getLinkcaseSnifferBrowserFolderKeys(browser)
	const selected_folder_count = x.getSnifferSelectedFolderCount(browser.id)
	const can_import =
		browser.available && folder_keys.length > 0 && selected_folder_count > 0 && !x.sniffer_importing_browser

	return (
		<div
			className='
				flex flex-col
				gap-4
				p-4
				rounded-3xl
				bg-secondary/20
				border border-border-light
			'
		>
			<div className='flex items-start justify-between gap-4'>
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
					<div
						className='
							flex flex-wrap
							items-center
							gap-x-3 gap-y-1
							mt-2
							text-std-300 text-xs
						'
					>
						<span>Profiles: {browser.source_count}</span>
						<span>Folders: {folder_keys.length}</span>
						<span>Selected: {selected_folder_count}</span>
					</div>
				</div>
				<div className='flex shrink-0 items-center gap-2'>
					<button
						className='
							flex
							items-center
							gap-1.5
							px-3 py-2
							rounded-4xl
							text-sm
							bg-background/80
							border border-border-light
							transition-colors
							hover:bg-secondary/60
						'
						type='button'
						onClick={() => x.toggleSnifferBrowserExpanded(browser.id)}
					>
						{expanded ? (
							<ChevronDown className='size-3.5'></ChevronDown>
						) : (
							<ChevronRight className='size-3.5'></ChevronRight>
						)}
						<span>Folders</span>
					</button>
					<Button
						size='sm'
						disabled={!can_import}
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
			</div>
			{expanded && (
				<div
					className='
						flex flex-col
						gap-3
						pt-4
						border-t border-border-light
					'
				>
					<div className='flex items-center justify-between gap-3'>
						<div className='text-std-400 text-xs'>
							Expand the browser card, then check the folders you want to import.
						</div>
						<div className='flex items-center gap-2'>
							<button
								className='
									text-std-400 text-xs
									underline
									decoration-border-light underline-offset-4
								'
								type='button'
								onClick={() => x.setSnifferSelectedFolderKeys(browser.id, folder_keys)}
							>
								Select all
							</button>
							<button
								className='
									text-std-400 text-xs
									underline
									decoration-border-light underline-offset-4
								'
								type='button'
								onClick={() => x.setSnifferSelectedFolderKeys(browser.id, [])}
							>
								Clear
							</button>
						</div>
					</div>
					<div className='flex flex-col gap-3'>
						{browser.sources.map(source => (
							<SourceSection
								browser={browser.id}
								source={source}
								key={source.id}
							></SourceSection>
						))}
					</div>
				</div>
			)}
		</div>
	)
})

const Index = () => {
	const x = useModel()

	return (
		<Dialog
			open={x.sniffer_dialog_open}
			title='Import Browser Bookmarks'
			desc='Choose one browser at a time. Click Folders to open the folder selector, then import only the checked bookmark folders.'
			className='w-[760px]'
			setOpen={x.setSnifferDialogOpen}
		>
			<div className='flex flex-col gap-4'>
				<div className='flex items-center justify-between gap-3'>
					<div className='text-std-400 text-sm'>
						Chrome, Firefox, and Edge stay separated here. There is no combined import action.
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
					{x.sniffer_statuses.map(browser => (
						<BrowserCard browser={browser} key={browser.id}></BrowserCard>
					))}
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
