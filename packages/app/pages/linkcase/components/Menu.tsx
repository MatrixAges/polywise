import { Globe, Loader, Search, TriangleAlert } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger
} from '@/__shadcn__/components/ui/context-menu'
import { Input } from '@/__shadcn__/components/ui/input'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/__shadcn__/components/ui/select'

import { useModel } from '../context'
import { getLinkFaviconSrc } from '../types'

const status_style_map = {
	none: 'bg-std-200/60 text-std-500',
	pending: 'bg-amber-100 text-amber-700',
	success: 'bg-emerald-100 text-emerald-700',
	fail: 'bg-rose-100 text-rose-700',
	timeout: 'bg-orange-100 text-orange-700',
	ignore: 'bg-slate-100 text-slate-600'
} as const

const Index = () => {
	const x = useModel()
	const menu_target = x.menu_target_item
	const menu_action_count = x.menu_action_ids.length

	return (
		<ContextMenu>
			<ContextMenuTrigger className='flex h-full'>
				<div
					className='
						flex flex-col shrink-0
						w-[320px] h-full
						bg-std-50/50
						border-r border-border-light
					'
					onContextMenuCapture={x.onMenuContextCapture}
				>
					<div
						className='
							flex
							items-center
							gap-2
							p-3
							border-b border-border-light
						'
					>
						<div className='relative min-w-0 flex-1'>
							<Search
								className='
									absolute
									top-1/2
									left-3
									size-3.5
									text-std-300
									pointer-events-none -translate-y-1/2
								'
							/>
							<Input
								className='pl-8'
								value={x.search_keyword}
								placeholder='Search links'
								onChange={event => x.setSearchKeyword(event.target.value)}
							></Input>
						</div>
						<Select
							value={x.filter_type}
							onValueChange={value => value && x.setFilterType(value)}
						>
							<SelectTrigger
								className='
									w-[92px]
									px-3 py-2
									rounded-4xl
									text-sm
									bg-secondary/60
								'
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align='end'>
								<SelectGroup>
									<SelectLabel>Filter</SelectLabel>
									<SelectItem value='title'>title</SelectItem>
									<SelectItem value='link'>link</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					{(x.has_checked_items || x.items.length > 0) && (
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
								{x.has_checked_items
									? `${x.checked_count} selected`
									: 'Select links for batch actions'}
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
					)}
					<div
						className='
							overflow-y-auto
							flex-1
							min-h-0
							px-2 py-2
						'
						onScroll={x.onMenuScroll}
					>
						<div className='flex flex-col gap-1'>
							{x.items.map((item, index) => {
								const favicon_src = getLinkFaviconSrc(item.favicon)
								const selected = x.selected_id === item.id

								return (
									<div
										className={$cx(
											`
										flex
										items-center
										gap-3
										px-3 py-2.5
										rounded-2xl
										border border-transparent
										group
										click_button
									`,
											selected &&
												'active border-border-light bg-secondary/80'
										)}
										data-index={index}
										onClick={() => x.selectLink(item.id)}
										key={item.id}
									>
										<div
											className='
											flex shrink-0
											items-center justify-center
											size-5
										'
											onClick={event => event.stopPropagation()}
										>
											<input
												className='accent-primary size-4 cursor-pointer'
												type='checkbox'
												checked={x.isLinkChecked(item.id)}
												onChange={event =>
													x.toggleLinkChecked(
														item.id,
														event.currentTarget.checked
													)
												}
											/>
										</div>
										<div
											className='
											overflow-hidden
											flex shrink-0
											items-center justify-center
											size-9
											rounded-2xl
											text-std-400
											bg-secondary
										'
										>
											{favicon_src ? (
												<img
													className='size-full object-cover'
													src={favicon_src}
													alt={item.title}
												/>
											) : (
												<Globe className='size-4'></Globe>
											)}
										</div>
										<div className='min-w-0 flex-1'>
											<div className='text-foreground truncate text-sm font-medium'>
												{item.title || item.url}
											</div>
											<div className='text-std-400 truncate text-xs'>
												{item.url}
											</div>
										</div>
										<div
											className={$cx(
												`
											shrink-0
											px-2 py-0.5
											rounded-full
											text-[11px] font-medium
										`,
												status_style_map[item.status]
											)}
										>
											{item.status}
										</div>
									</div>
								)
							})}
							{(x.has_more || x.loading_more) && (
								<Button
									className='w-full'
									variant='outline'
									size='sm'
									disabled={x.loading || x.loading_more}
									onClick={x.loadMoreList}
								>
									{x.loading_more && (
										<Loader className='size-3 animate-spin'></Loader>
									)}
									{x.loading_more ? 'Loading more' : 'Load more'}
								</Button>
							)}
							{x.loading_more && (
								<div
									className='
										flex
										items-center justify-center
										gap-2
										py-3
										text-xs text-std-300
									'
								>
									<Loader className='size-3 animate-spin'></Loader>
									<span>Loading more</span>
								</div>
							)}
							{!x.loading && x.items.length === 0 && (
								<div
									className='
										flex flex-col
										items-center justify-center
										min-h-[180px]
										gap-2
										rounded-3xl
										text-sm text-std-300
										border border-dashed border-border-light
									'
								>
									<TriangleAlert className='size-4'></TriangleAlert>
									<span>No links found</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</ContextMenuTrigger>
			{menu_target && menu_action_count > 0 && (
				<ContextMenuContent>
					{menu_action_count > 1 && (
						<>
							<ContextMenuLabel>{menu_action_count} links selected</ContextMenuLabel>
							<ContextMenuSeparator></ContextMenuSeparator>
						</>
					)}
					<ContextMenuItem onClick={() => void x.fetchMenuLinks()}>
						{menu_action_count > 1
							? `Fetch selected (${menu_action_count})`
							: menu_target.article
								? 'Refetch'
								: 'Fetch'}
					</ContextMenuItem>
					<ContextMenuItem variant='destructive' onClick={() => void x.removeMenuLinks()}>
						{menu_action_count > 1 ? `Remove selected (${menu_action_count})` : 'Remove'}
					</ContextMenuItem>
				</ContextMenuContent>
			)}
		</ContextMenu>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
