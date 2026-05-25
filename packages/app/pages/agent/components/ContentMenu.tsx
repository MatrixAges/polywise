import { Loader2, Paperclip, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Tabs } from '@/components'

import { article_tab_items } from '../articleTabItems'
import { useModel } from '../context'

import type { ArticleForType } from '../types'

const Index = () => {
	const {
		article_items,
		article_for,
		selected_article_id,
		article_loading,
		article_loading_more,
		article_has_more,
		can_manage_private_articles,
		can_mutate_selected_agent_articles,
		setArticleFor,
		setSelectedArticle,
		openCreatePrivateArticleDialog,
		openRelatedArticlesDialog,
		loadMorePrivateArticles
	} = useModel()

	return (
		<div
			className='
				flex flex-col shrink-0
				w-[192px]
				px-2 py-1.5
			'
		>
			<div
				className='
					flex
					items-center
					h-9
					gap-1
					px-1.5
				'
			>
				<div className='h-7 min-w-0 flex-1'>
					<Tabs
						small
						items={article_tab_items}
						active={article_for}
						onClick={value => setArticleFor(value as ArticleForType)}
					></Tabs>
				</div>
			</div>
			<div className='min-h-0 flex-1 overflow-hidden'>
				<div className='flex h-full flex-col'>
					<div
						className='
							overflow-y-auto
							flex flex-1 flex-col
							min-h-0
							px-1.5
							pb-1.5
						'
					>
						{article_loading ? (
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
								Loading articles...
							</div>
						) : article_items.length === 0 ? (
							<div className='text-std-400 px-3 py-4 text-sm'>
								{can_manage_private_articles
									? 'No private articles yet.'
									: 'No private articles.'}
							</div>
						) : (
							<div className='flex flex-col gap-1 pb-2'>
								{article_items.map(item => (
									<button
										className={$cx(
											`
												flex flex-col
												items-start
												w-full
												gap-1
												px-2 py-2
												rounded-md
												text-left
												hover:bg-secondary
											`,
											selected_article_id === item.id && 'bg-secondary'
										)}
										type='button'
										key={item.id}
										onClick={() => setSelectedArticle(item.id)}
									>
										<div className='line-clamp-2 text-sm font-medium'>
											{item.title || 'Untitled article'}
										</div>
									</button>
								))}
								{article_has_more ? (
									<div className='px-1 pt-1'>
										<Button
											className='h-7 w-full'
											variant='outline'
											size='xs'
											disabled={article_loading_more}
											onClick={() => void loadMorePrivateArticles()}
										>
											{article_loading_more ? (
												<Loader2 className='size-3.5 animate-spin'></Loader2>
											) : null}
											<span>
												{article_loading_more
													? 'Loading...'
													: 'Load more'}
											</span>
										</Button>
									</div>
								) : null}
							</div>
						)}
					</div>
					{can_manage_private_articles ? (
						<div
							className='
								flex
								items-center justify-between
								gap-2
								pt-1.5
							'
						>
							<button
								className='click_button small text-xs'
								disabled={!can_mutate_selected_agent_articles}
								onClick={openCreatePrivateArticleDialog}
							>
								<Plus className='size-3'></Plus>
								<span>Private</span>
							</button>
							<button
								className='click_button small text-xs'
								disabled={!can_mutate_selected_agent_articles}
								onClick={openRelatedArticlesDialog}
							>
								<Paperclip className='size-3'></Paperclip>
								<span>Related</span>
							</button>
						</div>
					) : null}
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
