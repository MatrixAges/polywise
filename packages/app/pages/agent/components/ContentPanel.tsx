import { Album, BookOpenText, Brain, Loader2, Plus, Search, UserRound, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Tabs } from '@/components'

import { useModel } from '../context'

import type { ArticleForType } from '../types'

const article_tab_items = [
	{ key: 'memory', Icon: Brain },
	{ key: 'wiki', Icon: BookOpenText },
	{ key: 'user', Icon: UserRound },
	{ key: 'linkcase', Icon: Album }
]

const Index = () => {
	const {
		article_items,
		article_for,
		article_search,
		article_search_list,
		article_search_loading,
		setArticleFor,
		setArticleSearch,
		clearArticleSearch,
		addArticle,
		removeArticle
	} = useModel()

	return (
		<div
			className='
				overflow-hidden
				flex flex-1 flex-col
				h-full
			'
		>
			<div
				className='
					flex shrink-0
					items-center justify-between
					h-9
					gap-2
					px-2.5
					border-b border-border-light
				'
			>
				<Tabs
					items={article_tab_items}
					active={article_for}
					simple
					onClick={value => setArticleFor(value as ArticleForType)}
				></Tabs>
				<div className='text-sm font-medium capitalize'>{article_for}</div>
			</div>
			<div
				className='
					shrink-0
					px-2.5 py-1.5
					border-b border-border-light
				'
			>
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
						value={article_search}
						placeholder={`Search ${article_for} article to relate`}
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
						No related articles.
					</div>
				) : (
					<div className='flex flex-col gap-2 pb-3'>
						{article_items.map(item => (
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
									<button
										className='icon_button small text-std-300 shrink-0'
										type='button'
										onClick={() => void removeArticle(item.id)}
									>
										<X className='size-3.5'></X>
									</button>
								</div>
								<div className='text-std-400 line-clamp-2 text-xs'>
									{item.content || 'Empty content'}
								</div>
							</div>
						))}
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
						Use search to relate an existing article.
					</div>
				) : null}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
