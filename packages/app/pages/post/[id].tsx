import { useEffect, useMemo, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { ArrowLeft, Bot, Database, Loader2, Plus, Save, Trash2, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Session, TextTabs } from '@/components'
import Editor from '@/components/Editor'
import { rpc } from '@/utils'

import { detail_tab_items, for_type_tab_items, normalizeHeadingText, parseOutline } from './shared'

import type { Editor as TiptapEditor } from '@tiptap/core'
import type { DetailTab, PostDetail, PostForType, RelatedArticle, RelatedSearchItem } from './shared'

const Index = () => {
	const navigate = useNavigate()
	const params = useParams()
	const route_post_id = params.id ?? ''

	const [detail_tab, setDetailTab] = useState<DetailTab>('outline')
	const [selected_post, setSelectedPost] = useState<PostDetail | null>(null)
	const [draft_title, setDraftTitle] = useState('')
	const [draft_content, setDraftContent] = useState('')
	const [draft_for_type, setDraftForType] = useState<PostForType>('user')
	const [post_loading, setPostLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [extracting, setExtracting] = useState(false)
	const [dirty, setDirty] = useState(false)
	const [session_id, setSessionId] = useState<string | null>(null)
	const [related_articles, setRelatedArticles] = useState<Array<RelatedArticle>>([])
	const [related_loading, setRelatedLoading] = useState(false)
	const [related_search, setRelatedSearch] = useState('')
	const [related_search_loading, setRelatedSearchLoading] = useState(false)
	const [related_search_list, setRelatedSearchList] = useState<Array<RelatedSearchItem>>([])
	const [ensuring_session, setEnsuringSession] = useState(false)
	const [session_draft_input, setSessionDraftInput] = useState<{
		key: string
		value: string
	} | null>(null)
	const [not_found, setNotFound] = useState(false)

	const save_timer_ref = useRef<ReturnType<typeof setTimeout> | 0>(0)
	const search_timer_ref = useRef<ReturnType<typeof setTimeout> | 0>(0)
	const read_request_key_ref = useRef('')
	const related_search_request_key_ref = useRef('')
	const save_promise_ref = useRef<Promise<PostDetail | null> | null>(null)
	const editor_area_ref = useRef<HTMLDivElement | null>(null)
	const dirty_ref = useRef(false)
	const selected_post_ref = useRef<PostDetail | null>(null)
	const draft_title_ref = useRef('')
	const draft_content_ref = useRef('')
	const draft_for_type_ref = useRef<PostForType>('user')
	const session_id_ref = useRef<string | null>(null)
	const session_running_ref = useRef(false)

	const outline_items = useMemo(() => parseOutline(draft_content), [draft_content])

	useEffect(() => {
		dirty_ref.current = dirty
	}, [dirty])

	useEffect(() => {
		selected_post_ref.current = selected_post
	}, [selected_post])

	useEffect(() => {
		draft_title_ref.current = draft_title
	}, [draft_title])

	useEffect(() => {
		draft_content_ref.current = draft_content
	}, [draft_content])

	useEffect(() => {
		draft_for_type_ref.current = draft_for_type
	}, [draft_for_type])

	useEffect(() => {
		session_id_ref.current = session_id
	}, [session_id])

	useEffect(() => {
		setSessionDraftInput(null)
	}, [route_post_id])

	const loadRelatedArticles = useMemoizedFn(async (post_id = route_post_id) => {
		if (!post_id) {
			setRelatedArticles([])

			return
		}

		setRelatedLoading(true)

		try {
			const response = await rpc.post.article.query.query({ post_id })

			if ((selected_post_ref.current?.id ?? route_post_id) === post_id) {
				setRelatedArticles(response)
			}
		} finally {
			setRelatedLoading(false)
		}
	})

	const loadPost = useMemoizedFn(async (id: string) => {
		if (!id) {
			return null
		}

		const request_key = `${id}:${Date.now()}`

		read_request_key_ref.current = request_key
		setPostLoading(true)
		setNotFound(false)

		try {
			const response = await rpc.post.read.query({ id })

			if (read_request_key_ref.current !== request_key) {
				return response
			}

			setSelectedPost(response)
			setDraftTitle(response.title ?? '')
			setDraftContent(response.content)
			setDraftForType(response.for_type)
			setSessionId(response.session_id)
			setDirty(false)

			if (detail_tab === 'related') {
				void loadRelatedArticles(response.id)
			}

			return response
		} catch (error) {
			if (read_request_key_ref.current === request_key) {
				setNotFound(true)
				setSelectedPost(null)
			}

			return null
		} finally {
			if (read_request_key_ref.current === request_key) {
				setPostLoading(false)
			}
		}
	})

	const reloadCurrentPost = useMemoizedFn(async () => {
		if (!route_post_id) {
			return null
		}

		const response = await rpc.post.read.query({ id: route_post_id })

		setSelectedPost(response)
		setSessionId(response.session_id)

		if (!dirty_ref.current) {
			setDraftTitle(response.title ?? '')
			setDraftContent(response.content)
			setDraftForType(response.for_type)
		}

		return response
	})

	const saveCurrentPost = useMemoizedFn(async (args?: { silent?: boolean; force?: boolean }) => {
		if (!route_post_id) {
			return null
		}

		if (!args?.force && !dirty_ref.current) {
			return selected_post_ref.current
		}

		if (save_promise_ref.current) {
			return save_promise_ref.current
		}

		const next_title = draft_title_ref.current
		const next_content = draft_content_ref.current
		const next_for_type = draft_for_type_ref.current

		setSaving(true)

		const promise = rpc.post.update
			.mutate({
				id: route_post_id,
				title: next_title,
				content: next_content,
				for_type: next_for_type
			})
			.then(response => {
				setSelectedPost(response)
				setSessionId(response.session_id)

				if (
					draft_title_ref.current === next_title &&
					draft_content_ref.current === next_content &&
					draft_for_type_ref.current === next_for_type
				) {
					setDraftTitle(response.title ?? '')
					setDraftContent(response.content)
					setDraftForType(response.for_type)
					setDirty(false)
				}

				if (!args?.silent) {
					toast.success('Post saved.')
				}

				return response
			})
			.catch(error => {
				if (!args?.silent) {
					toast.error(error instanceof Error ? error.message : String(error))
				}

				throw error
			})
			.finally(() => {
				save_promise_ref.current = null
				setSaving(false)
			})

		save_promise_ref.current = promise

		return promise
	})

	const ensureSession = useMemoizedFn(async () => {
		if (!route_post_id) {
			return null
		}

		if (session_id_ref.current) {
			return session_id_ref.current
		}

		setEnsuringSession(true)

		try {
			if (dirty_ref.current) {
				await saveCurrentPost({ silent: true, force: true })
			}

			const response = await rpc.post.session.ensure.mutate({
				post_id: route_post_id
			})

			setSessionId(response.session_id)

			if (selected_post_ref.current) {
				setSelectedPost({
					...selected_post_ref.current,
					session_id: response.session_id
				})
			}

			return response.session_id
		} finally {
			setEnsuringSession(false)
		}
	})

	const addReferenceToPostSessionInput = useMemoizedFn(async (editor: TiptapEditor) => {
		if (!route_post_id) {
			return
		}

		const { from, to } = editor.state.selection
		const selection_text = editor.state.doc.textBetween(from, to, '\n')

		if (!selection_text.trim()) {
			return
		}

		await saveCurrentPost({ silent: true })

		const before_context = editor.state.doc.textBetween(Math.max(0, from - 80), from, '\n')
		const after_context = editor.state.doc.textBetween(
			to,
			Math.min(editor.state.doc.content.size, to + 80),
			'\n'
		)
		const prompt = [
			'Reference from the current post:',
			'Use the marked passage below when answering or editing the current post.',
			`Selected text:\n<<<SELECTION\n${selection_text}\nSELECTION>>>`,
			before_context ? `Before context:\n<<<BEFORE\n${before_context}\nBEFORE>>>` : '',
			after_context ? `After context:\n<<<AFTER\n${after_context}\nAFTER>>>` : ''
		]
			.filter(Boolean)
			.join('\n\n')

		setDetailTab('session')
		const next_session_id = await ensureSession()

		if (!next_session_id) {
			return
		}

		setSessionDraftInput({
			key: `${route_post_id}:${Date.now()}`,
			value: prompt
		})
		toast.success('Reference added to post session input.')
	})

	const handleDeletePost = useMemoizedFn(async () => {
		const deleting_post = selected_post_ref.current

		if (!deleting_post) {
			return
		}

		if (!window.confirm(`Delete post "${deleting_post.title || 'Untitled'}"?`)) {
			return
		}

		await rpc.post.remove.mutate({ id: deleting_post.id })
		toast.success('Post removed.')
		navigate('/post')
	})

	const handleExtractPost = useMemoizedFn(async () => {
		if (!selected_post_ref.current) {
			return
		}

		await saveCurrentPost({ silent: true })
		setExtracting(true)

		try {
			const result = await rpc.post.extract.mutate({
				id: selected_post_ref.current.id,
				force: selected_post_ref.current.is_pipelined
			})

			toast.success(result.queued ? 'Extract queued.' : 'Extract completed.')
			await reloadCurrentPost()
		} finally {
			setExtracting(false)
		}
	})

	const handleAddRelatedArticle = useMemoizedFn(async (article_id: string) => {
		if (!route_post_id) {
			return
		}

		await rpc.post.article.add.mutate({
			post_id: route_post_id,
			article_id
		})
		await Promise.all([loadRelatedArticles(), reloadCurrentPost()])
		setRelatedSearchList(current => current.filter(item => item.id !== article_id))
	})

	const handleRemoveRelatedArticle = useMemoizedFn(async (article_id: string) => {
		if (!route_post_id) {
			return
		}

		await rpc.post.article.remove.mutate({
			post_id: route_post_id,
			article_id
		})
		await Promise.all([loadRelatedArticles(), reloadCurrentPost()])
	})

	const scrollToOutlineItem = useMemoizedFn((item: { text: string; level: number }) => {
		const editor_area = editor_area_ref.current
		const scroll_host = editor_area?.querySelector('.editor_wrap') as HTMLDivElement | null

		if (!scroll_host) {
			return
		}

		const headings = Array.from(scroll_host.querySelectorAll(`h${item.level}`)) as Array<HTMLHeadingElement>
		const target = headings.find(
			heading => normalizeHeadingText(heading.textContent ?? '') === normalizeHeadingText(item.text)
		)

		if (!target) {
			return
		}

		const host_rect = scroll_host.getBoundingClientRect()
		const target_rect = target.getBoundingClientRect()
		const next_top = scroll_host.scrollTop + (target_rect.top - host_rect.top) - 24

		scroll_host.scrollTo({
			top: Math.max(0, next_top),
			behavior: 'smooth'
		})
	})

	useEffect(() => {
		const run = async () => {
			if (!route_post_id) {
				return
			}

			if (selected_post_ref.current?.id && selected_post_ref.current.id !== route_post_id) {
				await saveCurrentPost({ silent: true, force: true })
			}

			await loadPost(route_post_id)
		}

		void run()
	}, [route_post_id])

	useEffect(() => {
		if (save_timer_ref.current) {
			clearTimeout(save_timer_ref.current)
			save_timer_ref.current = 0
		}

		if (!dirty || !route_post_id) {
			return
		}

		save_timer_ref.current = setTimeout(() => {
			void saveCurrentPost({ silent: true })
		}, 10_000)

		return () => {
			if (save_timer_ref.current) {
				clearTimeout(save_timer_ref.current)
				save_timer_ref.current = 0
			}
		}
	}, [dirty, draft_title, draft_content, draft_for_type, route_post_id])

	useEffect(() => {
		if (search_timer_ref.current) {
			clearTimeout(search_timer_ref.current)
			search_timer_ref.current = 0
		}

		if (!route_post_id || detail_tab !== 'related' || !related_search.trim()) {
			setRelatedSearchList([])
			setRelatedSearchLoading(false)

			return
		}

		setRelatedSearchLoading(true)
		const request_key = `${route_post_id}:${related_search.trim()}:${Date.now()}`

		related_search_request_key_ref.current = request_key

		search_timer_ref.current = setTimeout(() => {
			void rpc.post.article.search
				.query({
					post_id: route_post_id,
					query: related_search.trim(),
					page: 1
				})
				.then(response => {
					if (related_search_request_key_ref.current === request_key) {
						setRelatedSearchList(response.list)
					}
				})
				.finally(() => {
					if (related_search_request_key_ref.current === request_key) {
						setRelatedSearchLoading(false)
					}
				})
		}, 280)

		return () => {
			if (search_timer_ref.current) {
				clearTimeout(search_timer_ref.current)
				search_timer_ref.current = 0
			}
		}
	}, [related_search, detail_tab, route_post_id])

	useEffect(() => {
		if (detail_tab === 'related' && route_post_id) {
			void loadRelatedArticles(route_post_id)
		}
	}, [detail_tab, route_post_id])

	useEffect(() => {
		if (detail_tab === 'session' && route_post_id && !session_id && !ensuring_session) {
			void ensureSession()
		}
	}, [detail_tab, route_post_id, session_id, ensuring_session])

	useEffect(() => {
		const deinit = rpc.session.watchSessionStatus.subscribe(undefined, {
			onData: response => {
				const current_session_id = session_id_ref.current

				if (!current_session_id) {
					return
				}

				const status = response[current_session_id]

				if (!status) {
					return
				}

				const previous_running = session_running_ref.current

				session_running_ref.current = status.running

				if (previous_running && !status.running) {
					void reloadCurrentPost()

					if (detail_tab === 'related') {
						void loadRelatedArticles()
					}
				}
			}
		})

		return deinit.unsubscribe
	}, [detail_tab])

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
				event.preventDefault()
				void saveCurrentPost()
			}
		}

		window.addEventListener('keydown', onKeyDown)

		return () => window.removeEventListener('keydown', onKeyDown)
	}, [])

	useEffect(() => {
		return () => {
			if (dirty_ref.current && route_post_id) {
				void saveCurrentPost({ silent: true, force: true })
			}
		}
	}, [route_post_id])

	if (not_found) {
		return (
			<div
				className='
					flex flex-col
					items-center justify-center
					h-full
					gap-4
					text-center
				'
			>
				<div className='text-std-400 text-sm'>Post not found.</div>
				<Button variant='outline' onClick={() => navigate('/post')}>
					<ArrowLeft className='size-4'></ArrowLeft>
					<span>Back to posts</span>
				</Button>
			</div>
		)
	}

	return (
		<div className='flex h-full overflow-hidden'>
			<div
				className='
					flex flex-col shrink-0
					w-[360px]
					border-r border-border-light
				'
			>
				<div
					className='
						flex
						items-center
						h-12
						gap-2
						px-2.5
						border-b border-border-light
					'
				>
					<Button
						className='h-8 px-2.5'
						variant='ghost'
						size='sm'
						onClick={() => navigate('/post')}
					>
						<ArrowLeft className='size-4'></ArrowLeft>
						<span>Posts</span>
					</Button>
				</div>
				<div
					className='
						flex
						items-center
						h-11
						px-2.5
						border-b border-border-light
					'
				>
					{selected_post ? (
						<div className='h-full'>
							<TextTabs
								items={detail_tab_items.map(item => ({
									key: item.key,
									title: item.title,
									Icon: item.Icon
								}))}
								active={detail_tab}
								setActive={(value: DetailTab) => setDetailTab(value)}
							></TextTabs>
						</div>
					) : (
						<span className='text-std-400 text-sm'>Loading post</span>
					)}
				</div>
				<div className='min-h-0 flex-1 overflow-hidden'>
					{!selected_post ? (
						<div
							className='
								flex
								items-center justify-center
								h-full
								px-6
								text-sm text-std-400
								text-center
							'
						>
							{post_loading ? 'Loading post...' : 'Select a post from the list.'}
						</div>
					) : detail_tab === 'outline' ? (
						<div className='h-full overflow-y-auto p-2.5'>
							{outline_items.length === 0 ? (
								<div className='text-std-400 px-3 py-4 text-sm'>
									No markdown headings yet.
								</div>
							) : (
								<div className='flex flex-col gap-1.5'>
									{outline_items.map(item => (
										<div
											className='
													px-3 py-2
													rounded-lg
													text-sm text-foreground
													hover:bg-secondary
													cursor-pointer
												'
											style={{ paddingLeft: 12 + (item.level - 1) * 14 }}
											onClick={() => scrollToOutlineItem(item)}
											key={item.id}
										>
											{item.text}
										</div>
									))}
								</div>
							)}
						</div>
					) : detail_tab === 'related' ? (
						<div className='flex h-full flex-col overflow-hidden'>
							<div className='border-border-light border-b p-2.5'>
								<div className='relative'>
									<Input
										className='pl-8'
										placeholder='Search article to relate'
										value={related_search}
										onChange={event => setRelatedSearch(event.target.value)}
									></Input>
									{related_search ? (
										<button
											className='
														absolute
														top-2.5 right-2.5
														text-std-300
														hover:text-foreground
													'
											onClick={() => setRelatedSearch('')}
										>
											<X className='size-4'></X>
										</button>
									) : null}
								</div>
								{related_search.trim() ? (
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
										{related_search_loading ? (
											<div
												className='
															flex
															items-center
															gap-2
															px-2 py-2
															text-sm text-std-400
														'
											>
												<Loader2 className='size-4 animate-spin'></Loader2>
												Searching...
											</div>
										) : related_search_list.length === 0 ? (
											<div className='text-std-400 px-2 py-2 text-sm'>
												No matches.
											</div>
										) : (
											related_search_list.map(item => (
												<div
													className='
																	flex
																	items-start
																	justify-between
																	gap-2
																	px-2 py-2
																	rounded-md
																	hover:bg-secondary
																'
													key={item.id}
												>
													<div className='min-w-0'>
														<div className='truncate text-sm font-medium'>
															{item.title ||
																'Untitled article'}
														</div>
														<div className='text-std-400 line-clamp-2 text-xs'>
															{item.content_preview ||
																'Empty content'}
														</div>
													</div>
													<Button
														className='h-7 shrink-0'
														variant='outline'
														size='xs'
														onClick={() =>
															void handleAddRelatedArticle(
																item.id
															)
														}
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
							<div className='min-h-0 flex-1 overflow-y-auto p-2.5'>
								{related_loading ? (
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
										Loading related articles...
									</div>
								) : related_articles.length === 0 ? (
									<div className='text-std-400 px-3 py-4 text-sm'>
										No related articles.
									</div>
								) : (
									<div className='flex flex-col gap-2'>
										{related_articles.map(item => (
											<div
												className='border-border-light rounded-xl border p-3'
												key={item.id}
											>
												<div
													className='
																	flex
																	items-start
																	justify-between
																	gap-2
																	mb-1
																'
												>
													<div className='min-w-0 text-sm font-semibold'>
														{item.title || 'Untitled article'}
													</div>
													<Button
														className='h-7 shrink-0'
														variant='ghost'
														size='xs'
														onClick={() =>
															void handleRemoveRelatedArticle(
																item.id
															)
														}
													>
														<X className='size-3.5'></X>
													</Button>
												</div>
												<div className='text-std-400 line-clamp-3 text-xs'>
													{item.content_preview || 'Empty content'}
												</div>
												<div className='text-std-300 mt-2 text-[11px] uppercase'>
													{item.for_type}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					) : session_id ? (
						<Session
							type='global'
							id={session_id}
							draft_input={session_draft_input ?? undefined}
							show_session_mode_select={false}
							show_audit_mode_select={false}
						></Session>
					) : (
						<div
							className='
											flex flex-col
											items-center justify-center
											h-full
											gap-3
											px-6
											text-center
										'
						>
							<div className='text-std-400 text-sm'>
								Create a dedicated post session for AI-assisted writing.
							</div>
							<Button disabled={ensuring_session} onClick={() => void ensureSession()}>
								{ensuring_session && (
									<Loader2 className='size-4 animate-spin'></Loader2>
								)}
								<span>Create session</span>
							</Button>
						</div>
					)}
				</div>
			</div>
			<div
				className='
					overflow-hidden
					flex flex-1 flex-col
					min-w-0
				'
			>
				{selected_post ? (
					<>
						<div className='border-border-light border-b px-4 py-3'>
							<div className='flex items-center gap-3'>
								<Input
									className='h-9 flex-1 text-base font-semibold'
									placeholder='Untitled post'
									value={draft_title}
									onChange={event => {
										setDraftTitle(event.target.value)
										setDirty(true)
									}}
									onBlur={() => void saveCurrentPost({ silent: true })}
								></Input>
								<Button
									className='h-9'
									variant='outline'
									disabled={!dirty || saving}
									onClick={() => void saveCurrentPost()}
								>
									{saving ? (
										<Loader2 className='size-4 animate-spin'></Loader2>
									) : (
										<Save className='size-4'></Save>
									)}
									<span>{saving ? 'Saving' : 'Save'}</span>
								</Button>
								<Button
									className='h-9'
									variant='outline'
									disabled={extracting || post_loading}
									onClick={() => void handleExtractPost()}
								>
									{extracting ? (
										<Loader2 className='size-4 animate-spin'></Loader2>
									) : (
										<Database className='size-4'></Database>
									)}
									<span>
										{selected_post.is_pipelined ? 'Re-extract' : 'Extract'}
									</span>
								</Button>
								<Button
									className='h-9'
									variant='outline'
									disabled={saving || extracting}
									onClick={() => void handleDeletePost()}
								>
									<Trash2 className='size-4'></Trash2>
									<span>Delete</span>
								</Button>
							</div>
							<div
								className='
									flex
									items-center justify-between
									gap-4
									mt-3
								'
							>
								<div className='h-7'>
									<TextTabs
										items={for_type_tab_items.map(item => ({
											key: item.key,
											title: item.title,
											Icon: item.Icon
										}))}
										active={draft_for_type}
										setActive={(value: PostForType) => {
											setDraftForType(value)
											setDirty(true)
										}}
									></TextTabs>
								</div>
								<div className='text-std-400 text-xs'>
									{dirty ? 'Unsaved changes' : 'Saved'}
								</div>
							</div>
						</div>
						<div className='min-h-0 flex-1 overflow-hidden' ref={editor_area_ref}>
							{post_loading ? (
								<div
									className='
										flex
										items-center justify-center
										h-full
										text-sm text-std-400
									'
								>
									<Loader2 className='mr-2 size-4 animate-spin'></Loader2>
									Loading post...
								</div>
							) : (
								<Editor
									id={selected_post.id}
									value={draft_content}
									className='min-h-full px-5 py-4'
									rich_text
									onChange={value => {
										setDraftContent(value)
										setDirty(true)
									}}
									onBlur={() => void saveCurrentPost({ silent: true })}
									renderActionBarExtra={({ editor }) => (
										<div
											className='
													flex
													items-center
													gap-1
													px-2
													btn_format cursor-pointer
												'
											onClick={() =>
												void addReferenceToPostSessionInput(
													editor as TiptapEditor
												)
											}
											title='Add reference to post session'
										>
											<Bot className='size-3.5'></Bot>
											<span className='text-xs font-medium'>
												Add Reference
											</span>
										</div>
									)}
								></Editor>
							)}
						</div>
					</>
				) : (
					<div
						className='
							flex
							items-center justify-center
							h-full
							text-sm text-std-400
						'
					>
						Loading post...
					</div>
				)}
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by($app.memo).get()
