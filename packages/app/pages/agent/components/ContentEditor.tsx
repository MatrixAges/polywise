import { Fragment, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Input } from '@/__shadcn__/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import Editor from '@/components/Editor'
import { alert, fromNow } from '@/utils'

import { useModel } from '../context'
import { article_for_types } from '../types'

const Index = () => {
	const {
		selected_article,
		article_loading,
		article_draft_title,
		article_draft_content,
		article_draft_for,
		article_dirty,
		article_saving,
		can_manage_private_articles,
		can_mutate_selected_agent_articles,
		openCreatePrivateArticleDialog,
		removeArticle,
		setArticleDraftTitle,
		setArticleDraftContent,
		setArticleDraftFor,
		saveSelectedArticle
	} = useModel()
	const [character_count, setCharacterCount] = useState(0)

	const onRemove = async () => {
		if (!selected_article) {
			return
		}

		const confirmed = await alert({
			title: 'Remove Article',
			desc: 'Confirm remove this private article?'
		})

		if (!confirmed) {
			return
		}

		await removeArticle(selected_article.id)
	}

	if (!selected_article) {
		return (
			<div
				className='
					flex
					items-center justify-center
					h-full
					text-sm text-std-400
				'
			>
				{article_loading
					? 'Loading articles...'
					: can_manage_private_articles
						? 'Select a private article or create a new one.'
						: 'Select a private article.'}
			</div>
		)
	}

	return (
		<Fragment>
			<div className='h-9 min-w-0 px-3'>
				<div className='flex min-w-0 items-center gap-2'>
					<Input
						className='
							flex-1
							min-w-0
							px-0
							rounded-none
							text-xsm! font-medium
							bg-transparent
							focus:bg-transparent
						'
						placeholder='Untitled article'
						disabled={!can_mutate_selected_agent_articles}
						value={article_draft_title}
						onChange={event => setArticleDraftTitle(event.target.value)}
						onBlur={() => void saveSelectedArticle({ silent: true })}
					></Input>
					{can_manage_private_articles ? (
						<button
							className='icon_button small text-std-800!'
							type='button'
							disabled={!can_mutate_selected_agent_articles}
							onClick={openCreatePrivateArticleDialog}
						>
							<Plus className='size-3'></Plus>
						</button>
					) : null}
					<button
						className='icon_button small text-std-800!'
						type='button'
						disabled={!can_mutate_selected_agent_articles || article_saving}
						onClick={() => void onRemove()}
					>
						<Trash2 className='size-3'></Trash2>
					</button>
					<button
						className='icon_button small text-std-800!'
						type='button'
						disabled={!can_mutate_selected_agent_articles || !article_dirty || article_saving}
						onClick={() => void saveSelectedArticle()}
					>
						{article_saving ? (
							<Loader2 className='size-3 animate-spin'></Loader2>
						) : (
							<Save className='size-3'></Save>
						)}
					</button>
				</div>
			</div>
			<div
				className='
					overflow-hidden
					flex flex-1 flex-col
					min-w-0 min-h-0
				'
			>
				<div className='min-h-0 min-w-0 flex-1 overflow-hidden'>
					<Editor
						id={selected_article.id}
						value={article_draft_content}
						className='
							min-w-0 min-h-full
							px-6! pt-4.5!
							text-[14px]
						'
						placeholderStyle={{ top: 18, paddingInline: 24 }}
						rich_text
						readonly={!can_mutate_selected_agent_articles}
						onChange={value => setArticleDraftContent(value)}
						onCharacterCountChange={setCharacterCount}
						onBlur={() => void saveSelectedArticle({ silent: true })}
					></Editor>
				</div>
				<div
					className='
						flex
						items-center justify-between
						h-7
						min-w-0
						gap-4
						px-3
						text-xs text-std-300
					'
				>
					<div
						className='
							overflow-hidden
							flex flex-1
							items-center
							min-w-0
							gap-3
						'
					>
						<Select
							disabled={!can_mutate_selected_agent_articles}
							value={article_draft_for}
							onValueChange={value =>
								value && setArticleDraftFor(value as (typeof article_for_types)[number])
							}
						>
							<SelectTrigger
								className='
									min-w-0
									gap-0
									text-xs text-std-300
									capitalize
								'
								noStyle
								noActiveStyle
							>
								<SelectValue className='capitalize' />
							</SelectTrigger>
							<SelectContent align='start'>
								{article_for_types.map(item => (
									<SelectItem value={item} key={item}>
										<span className='capitalize'>{item}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className='truncate'>Updated {fromNow(selected_article.updated_at)}</div>
					</div>
					<div className='flex shrink-0 items-center gap-3'>
						<span>{article_dirty ? 'Unsaved changes' : 'Saved'}</span>
						<span>{character_count} characters</span>
					</div>
				</div>
			</div>
		</Fragment>
	)
}

export default observer(Index)
