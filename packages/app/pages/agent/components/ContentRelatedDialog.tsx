import { Loader2, Plus, Search, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/__shadcn__/components/ui/dialog'
import { Input } from '@/__shadcn__/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/__shadcn__/components/ui/popover'
import { Tabs } from '@/components'
import { getAppRouteHref } from '@/utils'

import { getArticleTabItems } from '../articleTabItems'
import { useModel } from '../context'

import type { ArticleForType } from '../types'

const Index = () => {
	const { t } = useTranslation(['agent', 'post', 'linkcase'])
	const article_tab_items = getArticleTabItems(t)
	const {
		related_articles_dialog_open,
		article_search,
		article_search_list,
		article_search_loading,
		related_article_items,
		related_article_for,
		related_article_has_more,
		related_article_loading,
		related_article_loading_more,
		can_mutate_selected_agent_articles,
		setRelatedArticlesDialogOpen,
		setArticleSearch,
		setRelatedArticleFor,
		clearArticleSearch,
		loadMoreRelatedArticles,
		addArticle,
		removeArticle
	} = useModel()

	return (
		<Dialog open={related_articles_dialog_open} onOpenChange={setRelatedArticlesDialogOpen}>
			<DialogContent className='w-[640px] max-w-[calc(100vw-32px)]!'>
				<DialogHeader>
					<DialogTitle>{t('related_articles.title', { ns: 'agent' })}</DialogTitle>
				</DialogHeader>
				<div className='flex max-h-[80vh] flex-col overflow-hidden'>
					<div className='px-0.5 py-1.5'>
						<Popover open={!!article_search.trim()}>
							<div className='relative'>
								<PopoverTrigger>
									<div className='h-8 w-full rounded-md' aria-hidden='true'></div>
								</PopoverTrigger>
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
									className='absolute inset-0 h-8 pl-6'
									placeholder={t('related_articles.search_placeholder', {
										ns: 'agent'
									})}
									disabled={!can_mutate_selected_agent_articles}
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
							<PopoverContent
								side='bottom'
								sideOffset={8}
								initialFocus={false}
								finalFocus={false}
								className='max-h-64 overflow-y-auto p-1'
							>
								{article_search_loading ? (
									<div
										className='
											flex
											items-center
											gap-2
											p-2
											text-sm text-std-400
										'
									>
										<Loader2 className='size-4 animate-spin'></Loader2>
										{t('related_articles.searching', { ns: 'agent' })}
									</div>
								) : article_search_list.length === 0 ? (
									<div className='text-std-400 p-2 text-sm'>
										{t('related_articles.no_matches', { ns: 'agent' })}
									</div>
								) : (
									<div className='flex flex-col gap-1'>
										{article_search_list.map(item => (
											<div
												className='
														flex
														items-start justify-between
														gap-2
														p-2
														rounded-xl
														hover:bg-secondary
													'
												key={item.id}
											>
												<div className='min-w-0'>
													<div className='truncate text-sm font-medium'>
														{item.title ||
															t(
																'related_articles.untitled_article',
																{ ns: 'agent' }
															)}
													</div>
													<div className='text-std-400 line-clamp-2 text-xs'>
														{item.content_preview ||
															t(
																'related_articles.empty_content',
																{ ns: 'agent' }
															)}
													</div>
													<div className='text-std-300 mt-1 text-[10px] uppercase'>
														{item.for_type}
													</div>
												</div>
												<Button
													className='h-7 shrink-0'
													variant='outline'
													size='xs'
													disabled={
														!can_mutate_selected_agent_articles
													}
													onClick={() =>
														void addArticle(
															item.id,
															item.for_type
														)
													}
												>
													<Plus className='size-3.5'></Plus>
													<span>
														{t('related_articles.relate', {
															ns: 'agent'
														})}
													</span>
												</Button>
											</div>
										))}
									</div>
								)}
							</PopoverContent>
						</Popover>
					</div>
					<div className='min-h-72 flex-1 overflow-y-auto px-1.5'>
						{related_article_loading ? (
							<div
								className='
									flex
									items-center
									gap-2
									px-1.5 py-4
									text-sm text-std-400
								'
							>
								<Loader2 className='size-4 animate-spin'></Loader2>
								{t('related_articles.loading', { ns: 'agent' })}
							</div>
						) : related_article_items.length === 0 ? (
							<div className='text-std-400 px-1.5 py-4 text-sm'>
								{t('related_articles.empty', { ns: 'agent' })}
							</div>
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
												{item.title ||
													t('related_articles.untitled_article', {
														ns: 'agent'
													})}
											</a>
										</div>
										<div className='flex'>
											<a
												className='text-std-400 hover:text-foreground line-clamp-2 text-xs'
												href={getAppRouteHref(`/article/${item.id}`)}
												target='_blank'
												rel='noreferrer'
											>
												{item.content ||
													t('related_articles.empty_content', {
														ns: 'agent'
													})}
											</a>
										</div>
										<div className='mt-2 flex items-center justify-between'>
											<span className='text-std-300 text-[10px] uppercase'>
												{item.for}
											</span>
											<button
												className='icon_button small text-std-300'
												type='button'
												disabled={!can_mutate_selected_agent_articles}
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
				<DialogFooter className='gap-3 pt-4 sm:justify-between'>
					<div className='flex min-w-0 items-center gap-2'>
						<div className='min-w-0'>
							<Tabs
								small
								items={[...article_tab_items]}
								active={related_article_for}
								onClick={value => setRelatedArticleFor(value as ArticleForType)}
							></Tabs>
						</div>
						{related_article_has_more ? (
							<Button
								className='h-7 shrink-0'
								variant='outline'
								size='xs'
								disabled={
									!can_mutate_selected_agent_articles ||
									related_article_loading_more
								}
								onClick={() => void loadMoreRelatedArticles()}
							>
								{related_article_loading_more ? (
									<Loader2 className='size-3.5 animate-spin'></Loader2>
								) : null}
								<span>
									{related_article_loading_more
										? t('content.loading', { ns: 'agent' })
										: t('related_articles.load_more', { ns: 'agent' })}
								</span>
							</Button>
						) : null}
					</div>
					<Button variant='outline' onClick={() => setRelatedArticlesDialogOpen(false)}>
						{t('related_articles.close', { ns: 'agent' })}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default observer(Index)
