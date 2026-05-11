import { Album, BookOpenText, Brain, Plus, Save, Trash2, UserRound } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Input } from '@/__shadcn__/components/ui/input'
import { Tabs } from '@/components'
import Editor from '@/components/Editor'

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
		<div className='flex h-full flex-1'>
			<div
				className='
					flex flex-col shrink-0
					w-48
					border-x border-border-light
				'
			>
				<div
					className='
						flex
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
					<button className='icon_button small' type='button' title='New' onClick={createArticle}>
						<Plus className='size-3.5'></Plus>
					</button>
				</div>
				<div
					className='
						overflow-y-auto
						flex flex-1 flex-col
						min-h-0
						px-2.5
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
				</div>
			</div>
			<div
				className='
					flex flex-1 flex-col
					min-w-0
				'
			>
				<div
					className='
						flex
						items-center justify-between
						h-9
						gap-2
						px-2.5
						border-b border-border-light
					'
				>
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
				<div
					className='
						flex flex-1 flex-col
						min-h-0
						gap-2
						p-2.5
					'
				>
					{selected_article_id && (
						<>
							<Input
								className='shrink-0'
								value={article_title_draft}
								placeholder='Content title'
								onChange={event => setArticleTitleDraft(event.target.value)}
							></Input>
							<div
								className='
									overflow-hidden
									flex-1
									min-h-0
									rounded-md
									bg-secondary/60
									border border-border-light
								'
							>
								<Editor
									id={`agent-article-${selected_article_id}`}
									key={selected_article_id}
									value={article_draft}
									onChange={setArticleDraft}
								></Editor>
							</div>
						</>
					)}
					{!selected_article_id && (
						<div
							className='
								flex flex-1
								items-center justify-center
								text-sm text-std-400
							'
						>
							Select an article
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
