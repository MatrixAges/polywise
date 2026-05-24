import { useEffect, useRef, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { Input } from '@/__shadcn__/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import Editor from '@/components/Editor'
import { formatDateTime, fromNow, rpc } from '@/utils'

import type { RPCOutput } from '@/types/rpc'

const article_for_types = ['memory', 'wiki', 'user', 'linkcase'] as const

type ArticleForType = (typeof article_for_types)[number]
type ArticleDetail = RPCOutput['article']['read']

const Index = () => {
	const params = useParams()
	const article_id = params.id ?? ''
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [article, setArticle] = useState<ArticleDetail | null>(null)
	const [draft_title, setDraftTitle] = useState('')
	const [draft_content, setDraftContent] = useState('')
	const [draft_for_type, setDraftForType] = useState<ArticleForType>('user')
	const [dirty, setDirty] = useState(false)
	const [saving, setSaving] = useState(false)
	const [character_count, setCharacterCount] = useState(0)
	const ref_save_timer = useRef<ReturnType<typeof setTimeout> | 0>(0)
	const ref_save_promise = useRef<Promise<ArticleDetail | null> | null>(null)
	const ref_latest = useRef({
		article: null as ArticleDetail | null,
		draft_title: '',
		draft_content: '',
		draft_for_type: 'user' as ArticleForType,
		dirty: false
	})

	const clearSaveTimer = () => {
		if (ref_save_timer.current) {
			clearTimeout(ref_save_timer.current)
			ref_save_timer.current = 0
		}
	}

	const applyArticleDraft = (response: ArticleDetail) => {
		setArticle(response)
		setDraftTitle(response.title ?? '')
		setDraftContent(response.content)
		setDraftForType(response.for_type as ArticleForType)
		setDirty(false)
		clearSaveTimer()
	}

	const saveCurrentArticle = async (args?: { silent?: boolean; force?: boolean }) => {
		const current_article = ref_latest.current.article

		if (!current_article) {
			return null
		}

		if (!args?.force && !ref_latest.current.dirty) {
			return current_article
		}

		if (ref_save_promise.current) {
			return ref_save_promise.current
		}

		const next_title = ref_latest.current.draft_title
		const next_content = ref_latest.current.draft_content
		const next_for_type = ref_latest.current.draft_for_type

		setSaving(true)
		clearSaveTimer()

		const promise = rpc.article.update
			.mutate({
				id: current_article.id,
				title: next_title,
				content: next_content,
				for_type: next_for_type
			})
			.then(response => {
				const latest = ref_latest.current

				if (latest.article?.id !== current_article.id) {
					return response
				}

				setArticle(response)

				if (
					latest.draft_title === next_title &&
					latest.draft_content === next_content &&
					latest.draft_for_type === next_for_type
				) {
					applyArticleDraft(response)
				}

				if (!args?.silent) {
					toast.success('Article saved.')
				}

				return response
			})
			.catch(error => {
				if (!args?.silent) {
					toast.error(error instanceof Error ? error.message : 'Failed to save article.')
				}

				throw error
			})
			.finally(() => {
				ref_save_promise.current = null
				setSaving(false)
			})

		ref_save_promise.current = promise

		return promise
	}

	const scheduleAutoSave = () => {
		clearSaveTimer()

		if (!ref_latest.current.article) {
			return
		}

		ref_save_timer.current = setTimeout(() => {
			void saveCurrentArticle({ silent: true })
		}, 10_000)
	}

	useEffect(() => {
		ref_latest.current = {
			article,
			draft_title,
			draft_content,
			draft_for_type,
			dirty
		}
	}, [article, draft_title, draft_content, draft_for_type, dirty])

	useEffect(() => {
		clearSaveTimer()

		if (!article_id) {
			setArticle(null)
			setError('Article not found.')
			setDirty(false)

			return
		}

		let mounted = true

		if (ref_latest.current.dirty && ref_latest.current.article?.id !== article_id) {
			void saveCurrentArticle({ silent: true, force: true })
		}

		setLoading(true)
		setError('')

		void rpc.article.read
			.query({ id: article_id })
			.then(response => {
				if (!mounted) {
					return
				}

				applyArticleDraft(response)
			})
			.catch(err => {
				if (!mounted) {
					return
				}

				setArticle(null)
				setError(err instanceof Error ? err.message : 'Failed to load article.')
			})
			.finally(() => {
				if (mounted) {
					setLoading(false)
				}
			})

		return () => {
			mounted = false
		}
	}, [article_id])

	useEffect(
		() => () => {
			clearSaveTimer()

			if (ref_latest.current.dirty && ref_latest.current.article) {
				void rpc.article.update.mutate({
					id: ref_latest.current.article.id,
					title: ref_latest.current.draft_title,
					content: ref_latest.current.draft_content,
					for_type: ref_latest.current.draft_for_type
				})
			}
		},
		[]
	)

	if (loading && !article) {
		return (
			<div
				className='
					flex
					items-center justify-center
					h-full
					text-sm text-std-400
				'
			>
				<Loader2 className='mr-2 size-4 animate-spin'></Loader2>
				Loading article...
			</div>
		)
	}

	if (error) {
		return (
			<div
				className='
					flex
					items-center justify-center
					h-full
					px-6
					text-sm text-std-400
				'
			>
				{error}
			</div>
		)
	}

	if (!article) {
		return (
			<div
				className='
					flex
					items-center justify-center
					h-full
					px-6
					text-sm text-std-400
				'
			>
				Article not found.
			</div>
		)
	}

	return (
		<div className='flex h-full flex-col overflow-hidden'>
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
						value={draft_title}
						onChange={event => {
							setDraftTitle(event.target.value)
							setDirty(true)
							scheduleAutoSave()
						}}
						onBlur={() => void saveCurrentArticle({ silent: true })}
					></Input>
					<button
						className='icon_button small text-std-800!'
						type='button'
						disabled={!dirty || saving}
						onClick={() => void saveCurrentArticle()}
					>
						{saving ? (
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
						id={article.id}
						value={draft_content}
						className='min-h-full px-6! pt-4.5! text-[14px]'
						rich_text
						onChange={value => {
							setDraftContent(value)
							setDirty(true)
							scheduleAutoSave()
						}}
						onCharacterCountChange={setCharacterCount}
						onBlur={() => void saveCurrentArticle({ silent: true })}
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
						<Select
							value={draft_for_type}
							onValueChange={value => {
								if (!value) {
									return
								}

								setDraftForType(value as ArticleForType)
								setDirty(true)
								scheduleAutoSave()
							}}
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
						{article.source ? <span>{article.source}</span> : null}
						<div
							title={
								article.updated_at
									? formatDateTime(article.updated_at, 'YYYY-MM-DD HH:mm:ss')
									: undefined
							}
						>
							{article.updated_at
								? `Updated ${fromNow(article.updated_at)}`
								: 'Not updated'}
						</div>
					</div>
					<div className='flex items-center gap-3'>
						<span>{dirty ? 'Unsaved changes' : 'Saved'}</span>
						<span>{character_count} characters</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by($app.memo).get()
