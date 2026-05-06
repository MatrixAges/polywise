import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
import { Tabs } from '@/components'

import { useModel } from '../context'

import type { ArticleForType } from '../types'

const article_tab_items = [
	{ key: 'memory', title: 'memory' },
	{ key: 'wiki', title: 'wiki' },
	{ key: 'user', title: 'user' },
	{ key: 'linkcase', title: 'linkcase' }
]

const Index = () => {
	const {
		article_items,
		article_for,
		selected_article_id,
		article_draft,
		article_saving,
		setArticleFor,
		setSelectedArticle,
		setArticleDraft,
		createArticle,
		saveArticle,
		removeArticle
	} = useModel()

	return (
		<div className='flex min-h-[360px] gap-4'>
			<div
				className='
					flex flex-col shrink-0
					w-72
					gap-3
					p-3
					rounded-xl
					border border-border-light
				'
			>
				<div className='flex items-center justify-between gap-2'>
					<Tabs
						items={article_tab_items}
						active={article_for}
						simple
						onClick={value => setArticleFor(value as ArticleForType)}
					></Tabs>
					<Button size='xs' onClick={createArticle}>
						New
					</Button>
				</div>
				<div
					className='
						overflow-y-auto
						flex flex-1 flex-col
						min-h-0
						gap-2
					'
				>
					{article_items.map(item => (
						<div
							className={$cx(
								`
								flex flex-col
								gap-2
								p-3
								rounded-xl
								border border-border-light
								cursor-pointer
							`,
								selected_article_id === item.id && 'bg-active border-transparent'
							)}
							onClick={() => setSelectedArticle(item.id)}
							key={item.id}
						>
							<div className='flex items-center justify-between gap-2'>
								<span className='text-xs font-medium uppercase'>{item.for}</span>
								<Button
									variant='ghost'
									size='xs'
									onClick={event => {
										event.stopPropagation()
										void removeArticle(item.id)
									}}
								>
									Delete
								</Button>
							</div>
							<div className='text-sm break-words whitespace-pre-wrap'>
								{item.content || 'Empty article'}
							</div>
						</div>
					))}
					{article_items.length === 0 && (
						<div
							className='
								flex flex-1
								items-center justify-center
								text-std-400 text-sm
							'
						>
							No articles
						</div>
					)}
				</div>
			</div>
			<div
				className='
					flex flex-1 flex-col
					min-w-0
					gap-3
					p-3
					rounded-xl
					border border-border-light
				'
			>
				<div className='flex items-center justify-between gap-2'>
					<div className='text-sm font-medium capitalize'>{article_for}</div>
					<Button size='xs' disabled={!selected_article_id || article_saving} onClick={saveArticle}>
						Save
					</Button>
				</div>
				{selected_article_id ? (
					<Textarea
						className='min-h-[320px] flex-1'
						value={article_draft}
						onChange={event => setArticleDraft(event.target.value)}
					></Textarea>
				) : (
					<div
						className='
							flex flex-1
							items-center justify-center
							text-std-400 text-sm
						'
					>
						Select an article
					</div>
				)}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
