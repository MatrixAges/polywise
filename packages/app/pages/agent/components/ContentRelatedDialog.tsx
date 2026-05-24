import { Loader2, Plus, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/__shadcn__/components/ui/dialog'
import { Input } from '@/__shadcn__/components/ui/input'
import { getAppRouteHref } from '@/utils'

import { useModel } from '../context'

const Index = () => {
	const {
		related_articles_dialog_open,
		article_search,
		article_search_list,
		article_search_loading,
		related_article_items,
		setRelatedArticlesDialogOpen,
		setArticleSearch,
		clearArticleSearch,
		addArticle,
		removeArticle
	} = useModel()

	return (
		<Dialog open={related_articles_dialog_open} onOpenChange={setRelatedArticlesDialogOpen}>
			<DialogContent className='w-[720px] max-w-[calc(100vw-32px)]!'>
				<DialogHeader>
					<DialogTitle>Related Articles</DialogTitle>
				</DialogHeader>
				<div className='flex max-h-[min(78vh,720px)] flex-col overflow-hidden'>
					<div className='px-0.5 py-1.5'>
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
								value={article_search}
								onChange={event => setArticleSearch(event.target.value)}
							></Input>
							{article_search ? (
								<button
									className='
										absolute
										top-2.5 right-2.5
										text-std-300
										hover:text-foreground
									'
									type='button'
									onClick={clearArticleSearch}
								>
									<X className='size-4'></X>
								</button>
							) : null}
						</div>
						{article_search.trim() ? (
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
								{article_search_loading ? (
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
								) : article_search_list.length === 0 ? (
									<div className='text-std-400 p-1.5 text-sm'>No matches.</div>
								) : (
									article_search_list.map(item => (
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
												onClick={() => void addArticle(item.id)}
											>
												<Plus className='size-3.5'></Plus>
												<span>Relate</span>
											</Button>
										</div>
									))
								)}
							</div>
						) : null}
					</div>
					<div className='min-h-0 flex-1 overflow-y-auto px-1.5'>
						{related_article_items.length === 0 ? (
							<div className='text-std-400 px-1.5 py-4 text-sm'>No related articles.</div>
						) : (
							<div className='flex flex-col gap-2 pb-3'>
								{related_article_items.map(item => (
									<div className='border-border-light border-b py-1' key={item.id}>
										<div
											className='
												flex
												items-start justify-between
												gap-2
												mb-1
											'
										>
											<a
												className='text-xsm line-clamp-3 font-medium hover:underline'
												href={getAppRouteHref(`/article/${item.id}`)}
												target='_blank'
												rel='noreferrer'
											>
												{item.title || 'Untitled article'}
											</a>
										</div>
										<div className='flex'>
											<a
												className='text-std-400 hover:text-foreground line-clamp-2 text-xs'
												href={getAppRouteHref(`/article/${item.id}`)}
												target='_blank'
												rel='noreferrer'
											>
												{item.content || 'Empty content'}
											</a>
										</div>
										<div className='mt-2 flex items-center justify-between'>
											<span className='text-std-300 text-[10px] uppercase'>
												{item.for}
											</span>
											<button
												className='icon_button small text-std-300'
												type='button'
												onClick={() => void removeArticle(item.id)}
											>
												<X className='size-3.5'></X>
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
				<DialogFooter className='pt-4'>
					<Button variant='outline' onClick={() => setRelatedArticlesDialogOpen(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default observer(Index)
