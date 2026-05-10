import { Album, BookOpenText, Brain, Plus, Save, Trash2, UserRound } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Input } from '@/__shadcn__/components/ui/input'
import { Textarea } from '@/__shadcn__/components/ui/textarea'
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
		selected_article_id,
		article_title_draft,
		article_draft,
		article_saving,
		setArticleFor,
		setSelectedArticle,
		setArticleTitleDraft,
		setArticleDraft,
		createArticle,
		saveArticle,
		removeArticle
	} = useModel()

	return (
		<div
			className='
				flex flex-1
				h-full
			'
		>
			<div
				className='
					flex flex-col shrink-0
					w-48
				'
			>
				<div className='flex items-center justify-between gap-2'>
					<Tabs
						items={article_tab_items}
						active={article_for}
						simple
						onClick={value => setArticleFor(value as ArticleForType)}
					></Tabs>
					<button className='icon_button small' type='button' title='New' onClick={createArticle}>
						<Plus className='size-3.5'></Plus>
					</button>
				</div>
				<div
					className='
						overflow-y-auto
						flex flex-1 flex-col
						min-h-0
						gap-1
					'
				>
					{article_items.map(item => (
						<div
							className={$cx('click_button', selected_article_id === item.id && 'active')}
							onClick={() => setSelectedArticle(item.id)}
							key={item.id}
						>
							<div
								className='
									flex-1
									min-w-0
									text-sm font-medium
									truncate
								'
							>
								{item.title || 'Untitled content'}
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
							No content
						</div>
					)}
				</div>
			</div>
			<div
				className='
					flex flex-1 flex-col
					min-w-0
					gap-3
					py-3
					pl-3
				'
			>
				<div className='flex items-center justify-between gap-2'>
					<div className='text-sm font-medium capitalize'>{article_for}</div>
					<div className='flex items-center gap-2'>
						<button
							className='icon_button small'
							type='button'
							disabled={!selected_article_id || article_saving}
							onClick={() => selected_article_id && removeArticle(selected_article_id)}
						>
							<Trash2></Trash2>
						</button>
						<button
							className='icon_button small'
							type='button'
							title='Save'
							disabled={!selected_article_id || article_saving}
							onClick={saveArticle}
						>
							<Save className='size-3.5'></Save>
						</button>
					</div>
				</div>
				{selected_article_id ? (
					<>
						<Input
							value={article_title_draft}
							placeholder='Content title'
							onChange={event => setArticleTitleDraft(event.target.value)}
						></Input>
						<Textarea
							className='bg-secondary/60 flex-1 border-none focus-within:ring-0!'
							value={article_draft}
							onChange={event => setArticleDraft(event.target.value)}
						></Textarea>
					</>
				) : (
					<div
						className='
							flex flex-1
							items-center justify-center
							text-std-400 text-sm
						'
					>
						Select content
					</div>
				)}
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
