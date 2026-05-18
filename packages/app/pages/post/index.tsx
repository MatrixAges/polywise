import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import {
	BookOpen,
	Brain,
	Database,
	Files,
	FileStack,
	LayoutPanelLeft,
	Link2,
	Loader2,
	MessageSquare,
	Plus,
	Save,
	Search,
	Sparkles,
	Trash2,
	UserRound,
	X
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Session, Tabs, TextTabs } from '@/components'
import Editor from '@/components/Editor'
import { rpc } from '@/utils'

import type { RPCOutput } from '@/types/rpc'
import type { Editor as TiptapEditor } from '@tiptap/core'

type PostForType = 'user' | 'wiki' | 'memory'
type MenuTab = 'list' | 'detail'
type DetailTab = 'outline' | 'related' | 'session'
type PostListItem = RPCOutput['post']['query']['list'][number]
type PostDetail = RPCOutput['post']['read']
type RelatedArticle = RPCOutput['post']['article']['query'][number]
type RelatedSearchItem = RPCOutput['post']['article']['search']['list'][number]

type ListState = {
	list: Array<PostListItem>
	page: number
	has_more: boolean
	loading: boolean
	inited: boolean
}

type ListStateMap = Record<PostForType, ListState>

const post_for_types = ['user', 'wiki', 'memory'] as const
const createEmptyListState = (): ListState => ({
	list: [],
	page: 1,
	has_more: false,
	loading: false,
	inited: false
})
const createListStateMap = (): ListStateMap => ({
	user: createEmptyListState(),
	wiki: createEmptyListState(),
	memory: createEmptyListState()
})
const getPreview = (content: string) => content.replace(/\s+/g, ' ').trim().slice(0, 180)
const mergePostList = <T extends { id: string }>(...lists: Array<Array<T>>) => {
	const result = [] as Array<T>
	const seen = new Set<string>()

	for (const list of lists) {
		for (const item of list) {
			if (seen.has(item.id)) {
				continue
			}

			seen.add(item.id)
			result.push(item)
		}
	}

	return result
}

const toListItem = (post: PostDetail): PostListItem => ({
	id: post.id,
	title: post.title,
	for_type: post.for_type,
	is_pipelined: post.is_pipelined,
	created_at: post.created_at,
	updated_at: post.updated_at,
	related_article_count: post.related_article_count,
	session_id: post.session_id,
	content_preview: getPreview(post.content),
	has_session: Boolean(post.session_id)
})

const replaceItemPreservingOrder = <T extends { id: string }>(list: Array<T>, next_item: T) => {
	const target_index = list.findIndex(item => item.id === next_item.id)

	if (target_index === -1) {
		return list
	}

	const next_list = [...list]

	next_list[target_index] = next_item

	return next_list
}

const parseOutline = (content: string) => {
	const lines = content.split('\n')
	const items = [] as Array<{ id: string; level: number; text: string }>

	for (const line of lines) {
		const match = /^(#{1,6})\s+(.+)$/.exec(line.trim())

		if (!match) {
			continue
		}

		items.push({
			id: `${items.length}-${match[2]}`,
			level: match[1].length,
			text: match[2]
		})
	}

	return items
}

const normalizeHeadingText = (value: string) => value.replace(/\s+/g, ' ').trim()

const for_type_tab_items = [
	{ key: 'user', title: 'user', Icon: UserRound },
	{ key: 'wiki', title: 'wiki', Icon: BookOpen },
	{ key: 'memory', title: 'memory', Icon: Brain }
] as const

const menu_tab_items = [
	{ key: 'list', title: 'Post List', Icon: LayoutPanelLeft },
	{ key: 'detail', title: 'Post Details', Icon: FileStack }
] as const

const detail_tab_items = [
	{ key: 'outline', title: 'Outline', Icon: Files },
	{ key: 'related', title: 'Related Articles', Icon: Link2 },
	{ key: 'session', title: 'Post Session', Icon: MessageSquare }
] as const

const Index = () => {
	const [menu_tab, setMenuTab] = useState<MenuTab>('list')
	const [detail_tab, setDetailTab] = useState<DetailTab>('outline')
	const [for_type, setForType] = useState<PostForType>('user')
	const [list_map, setListMap] = useState<ListStateMap>(createListStateMap)
	const [selected_id, setSelectedId] = useState('')
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

	const save_timer_ref = useRef<ReturnType<typeof setTimeout> | 0>(0)
	const search_timer_ref = useRef<ReturnType<typeof setTimeout> | 0>(0)
	const read_request_key_ref = useRef('')
	const related_search_request_key_ref = useRef('')
	const save_promise_ref = useRef<Promise<PostDetail | null> | null>(null)
	const editor_area_ref = useRef<HTMLDivElement | null>(null)
	const dirty_ref = useRef(false)
	const selected_id_ref = useRef('')
	const selected_post_ref = useRef<PostDetail | null>(null)
	const draft_title_ref = useRef('')
	const draft_content_ref = useRef('')
	const draft_for_type_ref = useRef<PostForType>('user')
	const session_id_ref = useRef<string | null>(null)
	const session_running_ref = useRef(false)

	const current_list_state = list_map[for_type]
	const outline_items = useMemo(() => parseOutline(draft_content), [draft_content])

	useEffect(() => {
		dirty_ref.current = dirty
	}, [dirty])

	useEffect(() => {
		selected_id_ref.current = selected_id
	}, [selected_id])

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

	const updateListCaches = useMemoizedFn((post: PostDetail, args?: { promote?: boolean }) => {
		const next_item = toListItem(post)
		const promote = args?.promote ?? true

		setListMap(current => {
			const next = { ...current }

			for (const key of post_for_types) {
				const existing_state = next[key]
				const filtered_list = existing_state.list.filter(item => item.id !== post.id)

				next[key] = {
					...existing_state,
					list:
						key === post.for_type
							? existing_state.inited
								? promote
									? [next_item, ...filtered_list]
									: replaceItemPreservingOrder(existing_state.list, next_item)
								: filtered_list
							: filtered_list
				}
			}

			return next
		})
	})

	const removePostFromCaches = useMemoizedFn((post_id: string) => {
		setListMap(current => {
			const next = { ...current }

			for (const key of post_for_types) {
				next[key] = {
					...next[key],
					list: next[key].list.filter(item => item.id !== post_id)
				}
			}

			return next
		})
	})

	const loadRelatedArticles = useMemoizedFn(async (post_id = selected_id_ref.current) => {
		if (!post_id) {
			setRelatedArticles([])

			return
		}

		setRelatedLoading(true)

		try {
			const response = await rpc.post.article.query.query({ post_id })

			if (selected_id_ref.current === post_id) {
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

		try {
			const response = await rpc.post.read.query({ id })

			if (read_request_key_ref.current !== request_key) {
				return response
			}

			setSelectedId(response.id)
			setSelectedPost(response)
			setDraftTitle(response.title ?? '')
			setDraftContent(response.content)
			setDraftForType(response.for_type)
			setSessionId(response.session_id)
			setDirty(false)
			updateListCaches(response, { promote: false })

			if (detail_tab === 'related') {
				void loadRelatedArticles(response.id)
			}

			return response
		} finally {
			if (read_request_key_ref.current === request_key) {
				setPostLoading(false)
			}
		}
	})

	const reloadCurrentPost = useMemoizedFn(async () => {
		if (!selected_id_ref.current) {
			return null
		}

		const response = await rpc.post.read.query({ id: selected_id_ref.current })

		setSelectedPost(response)
		setSessionId(response.session_id)
		updateListCaches(response, { promote: false })

		if (!dirty_ref.current) {
			setDraftTitle(response.title ?? '')
			setDraftContent(response.content)
			setDraftForType(response.for_type)
		}

		return response
	})

	const loadList = useMemoizedFn(async (target_for_type: PostForType, page = 1, append = false) => {
		setListMap(current => ({
			...current,
			[target_for_type]: {
				...current[target_for_type],
				loading: true
			}
		}))

		try {
			const response = await rpc.post.query.query({
				page,
				for_type: target_for_type
			})

			setListMap(current => ({
				...current,
				[target_for_type]: {
					list: append
						? mergePostList(current[target_for_type].list, response.list)
						: response.list,
					page,
					has_more: response.has_more,
					loading: false,
					inited: true
				}
			}))

			if (!selected_id_ref.current && response.list[0]) {
				void loadPost(response.list[0].id)
			}
		} catch (error) {
			setListMap(current => ({
				...current,
				[target_for_type]: {
					...current[target_for_type],
					loading: false
				}
			}))

			throw error
		}
	})

	const saveCurrentPost = useMemoizedFn(async (args?: { silent?: boolean; force?: boolean }) => {
		const post_id = selected_id_ref.current

		if (!post_id) {
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
				id: post_id,
				title: next_title,
				content: next_content,
				for_type: next_for_type
			})
			.then(response => {
				updateListCaches(response, { promote: true })

				if (selected_id_ref.current === post_id) {
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
		const post_id = selected_id_ref.current

		if (!post_id) {
			return null
		}

		if (selected_post_ref.current?.id === post_id && session_id_ref.current) {
			return session_id_ref.current
		}

		setEnsuringSession(true)

		try {
			if (dirty_ref.current && selected_id_ref.current === post_id) {
				await saveCurrentPost({ silent: true, force: true })
			}

			const response = await rpc.post.session.ensure.mutate({
				post_id
			})

			if (selected_id_ref.current === post_id) {
				setSessionId(response.session_id)

				if (selected_post_ref.current?.id === post_id) {
					const next_post = {
						...selected_post_ref.current,
						session_id: response.session_id
					}

					setSelectedPost(next_post)
					updateListCaches(next_post, { promote: false })
				}
			}

			return response.session_id
		} finally {
			setEnsuringSession(false)
		}
	})

	const submitRewriteSelection = useMemoizedFn(async (editor: TiptapEditor) => {
		const post_id = selected_id_ref.current

		if (!post_id) {
			return
		}

		const { from, to } = editor.state.selection
		const selection_text = editor.state.doc.textBetween(from, to, '\n')

		if (!selection_text.trim()) {
			return
		}

		const instruction = window.prompt(
			'Rewrite instructions',
			'Polish this passage while preserving its meaning.'
		)

		if (instruction === null) {
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
			'Rewrite the selected passage in the current post.',
			`Instruction: ${instruction || 'Polish the writing while preserving meaning.'}`,
			'Use post_tool action "replace_selection" to update the post directly.',
			`Selected text:\n<<<SELECTION\n${selection_text}\nSELECTION>>>`,
			before_context ? `Before context:\n<<<BEFORE\n${before_context}\nBEFORE>>>` : '',
			after_context ? `After context:\n<<<AFTER\n${after_context}\nAFTER>>>` : ''
		]
			.filter(Boolean)
			.join('\n\n')

		setMenuTab('detail')
		setDetailTab('session')
		const response = await rpc.post.session.submit.mutate({
			post_id,
			message: prompt
		})

		if (selected_id_ref.current === post_id) {
			setSessionId(response.session_id)
		}

		toast.success('Rewrite request sent to post session.')
	})

	const handleCreatePost = useMemoizedFn(async () => {
		await saveCurrentPost({ silent: true })

		const response = await rpc.post.create.mutate({
			for_type,
			title: '',
			content: ''
		})

		if (!response) {
			return
		}

		updateListCaches(response, { promote: true })
		setMenuTab('detail')
		await loadPost(response.id)
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
		removePostFromCaches(deleting_post.id)
		const deleted_post_id = deleting_post.id
		setSelectedId('')
		setSelectedPost(null)
		setDraftTitle('')
		setDraftContent('')
		setSessionId(null)
		setDirty(false)
		setRelatedArticles([])
		setRelatedSearch('')
		setRelatedSearchList([])
		toast.success('Post removed.')

		const fallback_item = list_map[for_type].list.find(item => item.id !== deleted_post_id)

		if (fallback_item) {
			void loadPost(fallback_item.id)
		} else {
			void loadList(for_type, 1, false)
		}
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

			if (result.queued) {
				toast.success('Extract queued.')
			} else {
				toast.success('Extract completed.')
			}

			await reloadCurrentPost()
		} finally {
			setExtracting(false)
		}
	})

	const handleSelectPost = useMemoizedFn(async (id: string) => {
		if (id === selected_id_ref.current) {
			return
		}

		await saveCurrentPost({ silent: true })
		await loadPost(id)
	})

	const handleAddRelatedArticle = useMemoizedFn(async (article_id: string) => {
		const post_id = selected_id_ref.current

		if (!post_id) {
			return
		}

		await rpc.post.article.add.mutate({
			post_id,
			article_id
		})
		await Promise.all([loadRelatedArticles(), reloadCurrentPost()])
		setRelatedSearchList(current => current.filter(item => item.id !== article_id))
	})

	const handleRemoveRelatedArticle = useMemoizedFn(async (article_id: string) => {
		const post_id = selected_id_ref.current

		if (!post_id) {
			return
		}

		await rpc.post.article.remove.mutate({
			post_id,
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

	useLayoutEffect(() => {
		void loadList(for_type, 1, false)
	}, [])

	useEffect(() => {
		if (!list_map[for_type].inited && !list_map[for_type].loading) {
			void loadList(for_type, 1, false)
		}
	}, [for_type])

	useEffect(() => {
		if (save_timer_ref.current) {
			clearTimeout(save_timer_ref.current)
			save_timer_ref.current = 0
		}

		if (!dirty || !selected_id) {
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
	}, [dirty, draft_title, draft_content, draft_for_type, selected_id])

	useEffect(() => {
		if (search_timer_ref.current) {
			clearTimeout(search_timer_ref.current)
			search_timer_ref.current = 0
		}

		if (!selected_id || detail_tab !== 'related' || !related_search.trim()) {
			setRelatedSearchList([])
			setRelatedSearchLoading(false)

			return
		}

		setRelatedSearchLoading(true)
		const request_key = `${selected_id}:${related_search.trim()}:${Date.now()}`

		related_search_request_key_ref.current = request_key

		search_timer_ref.current = setTimeout(() => {
			void rpc.post.article.search
				.query({
					post_id: selected_id,
					query: related_search.trim(),
					page: 1
				})
				.then(response => {
					if (
						selected_id_ref.current === selected_id &&
						related_search_request_key_ref.current === request_key
					) {
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
	}, [related_search, detail_tab, selected_id])

	useEffect(() => {
		if (detail_tab === 'related' && selected_id) {
			void loadRelatedArticles(selected_id)
		}
	}, [detail_tab, selected_id])

	useEffect(() => {
		if (detail_tab === 'session' && selected_id && !session_id && !ensuring_session) {
			void ensureSession()
		}
	}, [detail_tab, selected_id, session_id, ensuring_session])

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
			if (dirty_ref.current && selected_id_ref.current) {
				void saveCurrentPost({ silent: true, force: true })
			}
		}
	}, [])

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
						items-center justify-between
						h-12
						px-2.5
						border-b border-border-light
					'
				>
					<Tabs
						items={menu_tab_items.map(item => ({
							key: item.key,
							title: item.title,
							Icon: item.Icon
						}))}
						active={menu_tab}
						onClick={key => {
							const next_tab = key as MenuTab

							setMenuTab(next_tab)

							if (
								next_tab === 'detail' &&
								!selected_id_ref.current &&
								current_list_state.list[0]
							) {
								void loadPost(current_list_state.list[0].id)
							}
						}}
					></Tabs>
				</div>
				{menu_tab === 'list' ? (
					<>
						<div
							className='
								flex
								items-center justify-between
								h-11
								px-2.5
								border-b border-border-light
							'
						>
							<div className='h-full'>
								<TextTabs
									items={for_type_tab_items.map(item => ({
										key: item.key,
										title: item.title,
										Icon: item.Icon
									}))}
									active={for_type}
									setActive={(value: PostForType) => setForType(value)}
								></TextTabs>
							</div>
							<Button className='h-7' size='xs' onClick={() => void handleCreatePost()}>
								<Plus className='size-3.5'></Plus>
								<span>New</span>
							</Button>
						</div>
						<div
							className='
								overflow-y-auto
								flex flex-1 flex-col
								min-h-0
							'
						>
							{current_list_state.list.length === 0 && !current_list_state.loading ? (
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
									No posts yet.
								</div>
							) : (
								<div className='flex flex-col gap-2 p-2.5'>
									{current_list_state.list.map(item => (
										<div
											className={$cx(
												`
												p-3
												rounded-xl
												border border-border-light
												transition-colors
												hover:bg-secondary/70
												cursor-pointer
											`,
												selected_id === item.id &&
													'border-std-black bg-secondary'
											)}
											onClick={() => void handleSelectPost(item.id)}
											key={item.id}
										>
											<div
												className='
													flex
													items-start justify-between
													gap-2
													mb-1.5
												'
											>
												<div className='text-foreground line-clamp-2 text-sm font-semibold'>
													{item.title || 'Untitled post'}
												</div>
												<div className='text-std-400 shrink-0 text-[11px] uppercase'>
													{item.for_type}
												</div>
											</div>
											<div className='text-std-400 line-clamp-3 text-xs leading-5'>
												{item.content_preview || 'Empty content'}
											</div>
											<div
												className='
													flex
													items-center
													gap-3
													mt-2
													text-[11px] text-std-300
												'
											>
												<span>
													{item.related_article_count} related
												</span>
												<span>
													{item.has_session
														? 'session ready'
														: 'no session'}
												</span>
											</div>
										</div>
									))}
									{current_list_state.has_more && (
										<Button
											variant='outline'
											size='sm'
											disabled={current_list_state.loading}
											onClick={() =>
												void loadList(
													for_type,
													current_list_state.page + 1,
													true
												)
											}
										>
											{current_list_state.loading && (
												<Loader2 className='size-3.5 animate-spin'></Loader2>
											)}
											<span>Load more</span>
										</Button>
									)}
								</div>
							)}
						</div>
					</>
				) : (
					<>
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
								<span className='text-std-400 text-sm'>Select a post</span>
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
									Choose a post from the list first.
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
													style={{
														paddingLeft:
															12 + (item.level - 1) * 14
													}}
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
											<Search
												className='
															absolute
															top-2.5
															left-2.5
															size-4
															text-std-300
															pointer-events-none
														'
											></Search>
											<Input
												className='pl-8'
												placeholder='Search article to relate'
												value={related_search}
												onChange={event =>
													setRelatedSearch(event.target.value)
												}
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
																			px-2
																			py-2
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
																{item.title ||
																	'Untitled article'}
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
															{item.content_preview ||
																'Empty content'}
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
									<Button
										disabled={ensuring_session}
										onClick={() => void ensureSession()}
									>
										{ensuring_session && (
											<Loader2 className='size-4 animate-spin'></Loader2>
										)}
										<span>Create session</span>
									</Button>
								</div>
							)}
						</div>
					</>
				)}
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
												void submitRewriteSelection(
													editor as TiptapEditor
												)
											}
											title='Rewrite selection with AI'
										>
											<Sparkles className='size-3.5'></Sparkles>
											<span className='text-xs font-medium'>
												AI Rewrite
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
							flex flex-col
							items-center justify-center
							h-full
							gap-4
							text-center
						'
					>
						<div className='text-std-400 text-sm'>
							Select or create a post to start writing.
						</div>
						<Button onClick={() => void handleCreatePost()}>
							<Plus className='size-4'></Plus>
							<span>New post</span>
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by($app.memo).get()
