import { Loader2, Plus, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<div className='flex h-full flex-col overflow-hidden'>
			<div className='border-border-light border-b p-2.5'>
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
										onClick={() => void x.addRelatedArticle(item.id)}
									>
										<Plus className='size-3.5'></Plus>
										<span>Add</span>
									</Button>
								</div>
							))
						)}
					</div>
				) : null}
			</div>
			<div className='min-h-0 flex-1 overflow-y-auto p-2.5'>
				{x.related_loading ? (
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
							<div className='border-border-light rounded-xl border p-3' key={item.id}>
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
				)}
			</div>
		</div>
	)
}

export default observer(Index)
