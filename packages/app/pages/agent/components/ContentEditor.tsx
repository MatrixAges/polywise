import { Fragment, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Input } from '@/__shadcn__/components/ui/input'
import Editor from '@/components/Editor'
import { alert, fromNow } from '@/utils'

import { useModel } from '../context'

const Index = () => {
	const {
		selected_article,
		article_loading,
		article_draft_title,
		article_draft_content,
		article_dirty,
		article_saving,
		can_manage_private_articles,
		openCreatePrivateArticleDialog,
		removeArticle,
		setArticleDraftTitle,
		setArticleDraftContent,
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
			<div className='h-9 px-3'>
				<div className='flex items-center gap-2'>
					<Input
						className='
							flex-1
							px-0
							rounded-none
							text-xsm! font-medium
							bg-transparent
							focus:bg-transparent
						'
						placeholder='Untitled article'
						value={article_draft_title}
						onChange={event => setArticleDraftTitle(event.target.value)}
						onBlur={() => void saveSelectedArticle({ silent: true })}
					></Input>
					{can_manage_private_articles ? (
						<button
							className='icon_button small text-std-800!'
							type='button'
							onClick={openCreatePrivateArticleDialog}
						>
							<Plus className='size-3'></Plus>
						</button>
					) : null}
					<button
						className='icon_button small text-std-800!'
						type='button'
						disabled={article_saving}
						onClick={() => void onRemove()}
					>
						<Trash2 className='size-3'></Trash2>
					</button>
					<button
						className='icon_button small text-std-800!'
						type='button'
						disabled={!article_dirty || article_saving}
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
					min-h-0
				'
			>
				<div className='min-h-0 flex-1 overflow-hidden'>
					<Editor
						id={selected_article.id}
						value={article_draft_content}
						className='min-h-full px-6! pt-4.5! text-[14px]'
						rich_text
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
						gap-4
						px-3
						text-xs text-std-300
					'
				>
					<div className='flex items-center gap-3'>
						<span className='capitalize'>{selected_article.for}</span>
						<div>Updated {fromNow(selected_article.updated_at)}</div>
					</div>
					<div className='flex items-center gap-3'>
						<span>{article_dirty ? 'Unsaved changes' : 'Saved'}</span>
						<span>{character_count} characters</span>
					</div>
				</div>
			</div>
		</Fragment>
	)
}

export default observer(Index)
