import { useEffect, useMemo, useState } from 'react'
import { FolderGit2, Loader2, Plus, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Dialog, DialogFooter, TextTabs } from '@/components'

import { useModel } from '../context'

import type { LucideIcon } from 'lucide-react'
import type { RelatedSourceTab } from '../../types'

const related_tab_items: Array<{ key: RelatedSourceTab; title: string; Icon?: LucideIcon }> = [
	{ key: 'article', title: 'article' },
	{ key: 'project', title: 'project', Icon: FolderGit2 }
]

const Index = () => {
	const x = useModel()
	const [project_dialog_open, setProjectDialogOpen] = useState(false)
	const [project_query, setProjectQuery] = useState('')

	useEffect(() => {
		if (!project_dialog_open) {
			return
		}

		void x.loadRelatedProjectOptions()
	}, [project_dialog_open, x])

	useEffect(() => {
		if (!project_dialog_open) {
			setProjectQuery('')
		}
	}, [project_dialog_open])

	const related_project_id_set = useMemo(
		() => new Set(x.related_projects.map(item => item.id)),
		[x.related_projects]
	)
	const project_options = useMemo(() => {
		const keyword = project_query.trim().toLowerCase()

		return x.related_project_options.filter(item => {
			if (related_project_id_set.has(item.id)) {
				return false
			}

			if (!keyword) {
				return true
			}

			return `${item.name}\n${item.dir}`.toLowerCase().includes(keyword)
		})
	}, [project_query, related_project_id_set, x.related_project_options])

	return (
		<div className='flex h-full flex-col overflow-hidden'>
			<div className='border-border-light border-b p-2.5'>
				<div
					className='
						flex
						items-center justify-between
						gap-3
						mb-2
					'
				>
					<TextTabs
						items={related_tab_items}
						active={x.related_tab}
						setActive={value => x.setRelatedTab(value as RelatedSourceTab)}
					></TextTabs>
					{x.related_tab === 'project' ? (
						<Button
							className='h-7 shrink-0'
							variant='outline'
							size='xs'
							onClick={() => setProjectDialogOpen(true)}
						>
							<Plus className='size-3.5'></Plus>
							<span>Add</span>
						</Button>
					) : null}
				</div>
				{x.related_tab === 'article' ? (
					<>
						<div className='relative'>
							<Search
								className='
									absolute
									top-1/2
									left-3
									size-4
									text-std-300
									pointer-events-none -translate-y-1/2
								'
							></Search>
							<Input
								className='pl-8'
								placeholder='Search article to relate'
								value={x.related_search}
								onChange={event => x.setRelatedSearch(event.target.value)}
							></Input>
							{x.related_search ? (
								<button
									className='
										absolute
										top-2.5 right-2.5
										text-std-300
										hover:text-foreground
									'
									onClick={() => x.clearRelatedSearch()}
								>
									<X className='size-4'></X>
								</button>
							) : null}
						</div>
						{x.related_search.trim() ? (
							<div
								className='
									overflow-y-auto
									flex flex-col
									max-h-40
									gap-1
									p-1.5
									mt-2
									rounded-lg
									border border-border-light
								'
							>
								{x.related_search_loading ? (
									<div
										className='
											flex
											items-center
											gap-2
											px-2 py-2
											text-sm text-std-400
										'
									>
										<Loader2 className='size-4 animate-spin'></Loader2>
										Searching...
									</div>
								) : x.related_search_list.length === 0 ? (
									<div className='text-std-400 px-2 py-2 text-sm'>No matches.</div>
								) : (
									x.related_search_list.map(item => (
										<div
											className='
													flex
													items-start justify-between
													gap-2
													px-2 py-2
													rounded-md
													hover:bg-secondary
												'
											key={item.id}
										>
											<div className='min-w-0'>
												<div className='truncate text-sm font-medium'>
													{item.title || 'Untitled article'}
												</div>
												<div className='text-std-400 line-clamp-2 text-xs'>
													{item.content_preview || 'Empty content'}
												</div>
											</div>
											<Button
												className='h-7 shrink-0'
												variant='outline'
												size='xs'
												onClick={() =>
													void x.addRelatedArticle(item.id)
												}
											>
												<Plus className='size-3.5'></Plus>
												<span>Add</span>
											</Button>
										</div>
									))
								)}
							</div>
						) : null}
					</>
				) : (
					<div className='text-std-400 px-1 text-xs'>
						Related project files will be used as first-source search results in the post
						session.
					</div>
				)}
			</div>
			<div className='min-h-0 flex-1 overflow-y-auto p-2.5'>
				{x.related_tab === 'article' ? (
					x.related_loading ? (
						<div
							className='
								flex
								items-center
								gap-2
								px-3 py-4
								text-sm text-std-400
							'
						>
							<Loader2 className='size-4 animate-spin'></Loader2>
							Loading related articles...
						</div>
					) : x.related_articles.length === 0 ? (
						<div className='text-std-400 px-3 py-4 text-sm'>No related articles.</div>
					) : (
						<div className='flex flex-col gap-2'>
							{x.related_articles.map(item => (
								<div
									className='border-border-light rounded-xl border p-3'
									key={item.id}
								>
									<div
										className='
												flex
												items-start justify-between
												gap-2
												mb-1
											'
									>
										<div className='min-w-0 text-sm font-semibold'>
											{item.title || 'Untitled article'}
										</div>
										<Button
											className='h-7 shrink-0'
											variant='ghost'
											size='xs'
											onClick={() => void x.removeRelatedArticle(item.id)}
										>
											<X className='size-3.5'></X>
										</Button>
									</div>
									<div className='text-std-400 line-clamp-3 text-xs'>
										{item.content_preview || 'Empty content'}
									</div>
									<div className='text-std-300 mt-2 text-[11px] uppercase'>
										{item.for_type}
									</div>
								</div>
							))}
						</div>
					)
				) : x.related_projects_loading ? (
					<div
						className='
								flex
								items-center
								gap-2
								px-3 py-4
								text-sm text-std-400
							'
					>
						<Loader2 className='size-4 animate-spin'></Loader2>
						Loading related projects...
					</div>
				) : x.related_projects.length === 0 ? (
					<div className='text-std-400 px-3 py-4 text-sm'>No related projects.</div>
				) : (
					<div className='flex flex-col gap-2'>
						{x.related_projects.map(item => (
							<div className='border-border-light rounded-xl border p-3' key={item.id}>
								<div
									className='
												flex
												items-start justify-between
												gap-2
												mb-1
											'
								>
									<div className='min-w-0'>
										<div className='truncate text-sm font-semibold'>
											{item.name}
										</div>
										<div className='text-std-400 truncate text-xs'>
											{item.dir}
										</div>
									</div>
									<Button
										className='h-7 shrink-0'
										variant='ghost'
										size='xs'
										onClick={() => void x.removeRelatedProject(item.id)}
									>
										<X className='size-3.5'></X>
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
			<Dialog
				open={project_dialog_open}
				title='Add Related Project'
				desc='Select one or more projects. Their files become first-source search inputs for this post.'
				setOpen={setProjectDialogOpen}
				className='w-[640px] max-w-none!'
			>
				<div className='flex flex-col gap-3'>
					<div className='relative'>
						<Search
							className='
								absolute
								top-1/2
								left-3
								size-4
								text-std-300
								pointer-events-none -translate-y-1/2
							'
						></Search>
						<Input
							className='pl-8'
							placeholder='Search projects'
							value={project_query}
							onChange={event => setProjectQuery(event.target.value)}
						></Input>
					</div>
					<div
						className='
							overflow-y-auto
							max-h-[42vh]
							rounded-lg
							border border-border-light
						'
					>
						{x.related_project_options_loading ? (
							<div
								className='
									flex
									items-center
									gap-2
									px-3 py-4
									text-std-400 text-sm
								'
							>
								<Loader2 className='size-4 animate-spin'></Loader2>
								Loading projects...
							</div>
						) : project_options.length === 0 ? (
							<div className='text-std-400 px-3 py-4 text-sm'>No available projects.</div>
						) : (
							<div className='flex flex-col p-1.5'>
								{project_options.map(item => (
									<div
										className='
												flex
												items-start justify-between
												gap-3
												px-2 py-2
												rounded-md
												hover:bg-secondary
											'
										key={item.id}
									>
										<div className='min-w-0'>
											<div className='truncate text-sm font-medium'>
												{item.name}
											</div>
											<div className='text-std-400 truncate text-xs'>
												{item.dir}
											</div>
										</div>
										<Button
											className='h-7 shrink-0'
											variant='outline'
											size='xs'
											onClick={() => {
												void x.addRelatedProject(item.id)
												setProjectQuery('')
											}}
										>
											<Plus className='size-3.5'></Plus>
											<span>Add</span>
										</Button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
				<DialogFooter className='mt-4'>
					<Button variant='outline' onClick={() => setProjectDialogOpen(false)}>
						Close
					</Button>
				</DialogFooter>
			</Dialog>
		</div>
	)
}

export default observer(Index)
