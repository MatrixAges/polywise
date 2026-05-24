import { Album, BookOpenText, Brain, FilePenLine, Loader2, Plus, Search, UserRound, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { TextTabs } from '@/components'

import { useModel } from '../context'

import type { ArticleForType } from '../types'

const article_tab_items = [
	{ key: 'memory', title: 'memory', Icon: Brain },
	{ key: 'wiki', title: 'wiki', Icon: BookOpenText },
	{ key: 'user', title: 'user', Icon: UserRound },
	{ key: 'linkcase', title: 'linkcase', Icon: Album }
]

const Index = () => {
	const {
		article_items,
		article_for,
		article_search,
		article_search_list,
		article_search_loading,
		can_manage_private_articles,
		selected_agent_id,
		setArticleFor,
		setArticleSearch,
		clearArticleSearch,
		openCreatePrivateArticleDialog,
		openEditPrivateArticleDialog,
		addArticle,
		removeArticle
	} = useModel()

	return (
		<div
			className='
				overflow-hidden
				flex flex-1 flex-col
				h-full
				page_wrap
			'
		>
			<div
				className='
					shrink-0
					px-2.5
				'
			>
				<div
					className='
						flex
						items-center justify-between
						gap-3
						mb-1.5
					'
				>
					<div className='h-7 min-w-0'>
						<TextTabs
							className='gap-3'
							items={article_tab_items}
							active={article_for}
							setActive={value => setArticleFor(value as ArticleForType)}
						></TextTabs>
					</div>
					<div
						className='
							flex shrink-0
							items-center
							gap-1.5
						'
					>
						{can_manage_private_articles ? (
							<Button
								className='h-7 shrink-0 gap-1 px-2.5'
								variant='outline'
								size='xs'
								onClick={openCreatePrivateArticleDialog}
							>
								<Plus className='size-3.5'></Plus>
								<span>New</span>
							</Button>
						) : null}
						<div
							className='
								relative
								flex
								items-center
								w-[180px]
							'
						>
							<Search
								className='
									absolute
									top-1/2
									left-2
									size-3.5
									text-std-300
									pointer-events-none -translate-y-1/2
								'
							></Search>
							<Input
								className='
									h-7
									pl-6.5 pr-8
									rounded-full
									text-sm
									placeholder:text-xs!
								'
								value={article_search}
								placeholder={`Search ${article_for}`}
								onChange={event => setArticleSearch(event.target.value)}
							></Input>
							{article_search ? (
								<button
									className='
										absolute
										right-0
										w-7 h-7
										icon_button small
									'
									type='button'
									onClick={clearArticleSearch}
								>
									<X className='size-3.5'></X>
								</button>
							) : null}
						</div>
					</div>
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
			<div
				className='
					overflow-y-auto
					flex-1
					min-h-0
					px-3.5
				'
			>
				{article_items.length === 0 ? (
					<div
						className='
							flex
							items-center
							px-1.5 py-4
							text-sm text-std-400
						'
					>
						No articles yet.
					</div>
				) : (
					<div className='flex flex-col gap-2 pb-3'>
						{article_items.map(item => {
							const is_private_article =
								item.scope_type === 'agent' && item.scope_id === selected_agent_id

							return (
								<div
									className='
									py-2
									border-b border-border-light
								'
									key={item.id}
								>
									<div
										className='
										flex
										items-start justify-between
										gap-2
									'
									>
										<div className='min-w-0 flex-1'>
											<div className='flex items-center gap-2'>
												<div className='line-clamp-3 text-sm font-medium'>
													{item.title || 'Untitled article'}
												</div>
												<span
													className={
														is_private_article
															? '
													px-1.5 py-0.5
													rounded-full
													text-[10px] text-std-500 tracking-[0.08em]
													uppercase
													bg-secondary
												'
															: '
													px-1.5 py-0.5
													rounded-full
													text-[10px] text-std-400 tracking-[0.08em]
													uppercase
													bg-std-100
												'
													}
												>
													{is_private_article
														? 'Private'
														: 'Related'}
												</span>
											</div>
											<div
												className='
												mt-0.5
												text-std-400 text-[11px] tracking-[0.08em]
												uppercase
											'
											>
												{item.for_type}
											</div>
										</div>
										<div className='flex shrink-0 items-center gap-1'>
											{is_private_article && can_manage_private_articles ? (
												<button
													className='icon_button small text-std-300'
													type='button'
													onClick={() =>
														openEditPrivateArticleDialog(item)
													}
												>
													<FilePenLine className='size-3.5'></FilePenLine>
												</button>
											) : null}
											<button
												className='icon_button small text-std-300'
												type='button'
												onClick={() => void removeArticle(item.id)}
											>
												<X className='size-3.5'></X>
											</button>
										</div>
									</div>
									<div className='text-std-400 text-xsm line-clamp-2'>
										{item.content || 'Empty content'}
									</div>
								</div>
							)
						})}
					</div>
				)}
				{!article_items.length && !article_search.trim() ? (
					<div
						className='
							px-1.5
							pb-4
							text-xs text-std-300
						'
					>
						{can_manage_private_articles
							? 'Use search to relate an existing article, or create a private one for this agent.'
							: 'Use search to relate an existing article.'}
					</div>
				) : null}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
