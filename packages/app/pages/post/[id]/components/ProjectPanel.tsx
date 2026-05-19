import { Loader2, Plus, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Dialog, DialogFooter } from '@/components'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<div className='flex h-full flex-col overflow-hidden'>
			<div
				className='
					flex
					items-center justify-between
					gap-3
					px-2.5 py-1.5
				'
			>
				<div className='text-std-400 text-xs'>
					Related project files will be used as first-source search results
				</div>
				<Button
					className='h-7 shrink-0'
					variant='outline'
					size='xs'
					onClick={() => x.setProjectDialogOpen(true)}
				>
					<Plus className='size-3.5'></Plus>
					<span>Add</span>
				</Button>
			</div>
			<div className='min-h-0 flex-1 overflow-y-auto p-2.5'>
				{x.related_projects_loading ? (
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
					<div className='flex flex-col gap-2.5'>
						{x.related_projects.map(item => (
							<div
								className='
										flex
										items-center justify-between
										gap-3
										pb-2.5
										border-b border-border-light
									'
								key={item.id}
							>
								<div
									className='
											flex flex-1 flex-col
											min-w-0
											gap-1
										'
								>
									<span className='truncate text-sm font-medium capitalize'>
										{item.name}
									</span>
									<span className='text-std-400 text-xs break-all'>{item.dir}</span>
								</div>
								<span
									className='icon_button small shrink-0'
									onClick={() => x.removeRelatedProject(item.id)}
								>
									<X className='size-3.5'></X>
								</span>
							</div>
						))}
					</div>
				)}
			</div>
			<Dialog
				open={x.project_dialog_open}
				title='Add Related Project'
				desc='Select one or more projects. Their files become first-source search inputs for this post.'
				setOpen={x.setProjectDialogOpen}
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
							value={x.project_query}
							onChange={event => x.setProjectQuery(event.target.value)}
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
						) : x.filtered_related_project_options.length === 0 ? (
							<div className='text-std-400 px-3 py-4 text-sm'>No available projects.</div>
						) : (
							<div className='flex flex-col p-1.5'>
								{x.filtered_related_project_options.map(item => (
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
					<Button variant='outline' onClick={() => x.setProjectDialogOpen(false)}>
						Close
					</Button>
				</DialogFooter>
			</Dialog>
		</div>
	)
}

export default observer(Index)
