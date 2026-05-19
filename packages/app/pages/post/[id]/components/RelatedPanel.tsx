import { Loader2, Plus, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<div className='flex h-full flex-col overflow-hidden'>
			<div className='px-2.5 py-1.5'>
				<div className='relative'>
					<Search
						className='
							absolute
							top-1/2
							left-1.5
							size-3.5
							text-std-300
							pointer-events-none -translate-y-1/2
						'
					></Search>
					<Input
						className='h-8 pl-6'
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
									p-1.5
									text-sm text-std-400
								'
							>
								<Loader2 className='size-4 animate-spin'></Loader2>
								Searching...
							</div>
						) : x.related_search_list.length === 0 ? (
							<div className='text-std-400 p-1.5 text-sm'>No matches.</div>
						) : (
							x.related_search_list.map(item => (
								<div
									className='
											flex
											items-start justify-between
											gap-2
											p-1.5
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
			<div
				className='
					overflow-y-auto
					flex-1
					min-h-0
					px-2.5
				'
			>
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
					<div className='text-std-400 px-1.5 py-4 text-sm'>No related articles.</div>
				) : (
					<div className='flex flex-col gap-2 pb-3'>
						{x.related_articles.map(item => (
							<div
								className='
										py-1
										border-b border-border-light
									'
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
									<div className='text-xsm line-clamp-3 font-medium'>
										{item.title || 'Untitled article'}
									</div>
								</div>
								<div className='text-std-400 line-clamp-2 text-xs'>
									{item.content_preview || 'Empty content'}
								</div>
								<div className='mt-2 flex items-center justify-between'>
									<span className='text-std-300 text-[10px] uppercase'>
										{item.for_type}
									</span>
									<span
										className='icon_button small text-std-300'
										onClick={() => void x.removeRelatedArticle(item.id)}
									>
										<X className='size-3.5'></X>
									</span>
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
