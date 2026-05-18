import { useEffect, useLayoutEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { LayoutPanelLeft, Loader2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Button } from '@/__shadcn__/components/ui/button'
import { Tabs, TextTabs } from '@/components'
import { rpc } from '@/utils'

import { createListStateMap, for_type_tab_items, getPreview, mergePostList } from './shared'

import type { PostForType } from './shared'

const menu_tab_items = [{ key: 'list', title: 'Post List', Icon: LayoutPanelLeft }] as const

const Index = () => {
	const navigate = useNavigate()
	const [for_type, setForType] = useState<PostForType>('user')
	const [list_map, setListMap] = useState(createListStateMap)

	const current_list_state = list_map[for_type]

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

	const handleCreatePost = useMemoizedFn(async () => {
		const response = await rpc.post.create.mutate({
			for_type,
			title: '',
			content: ''
		})

		if (!response) {
			return
		}

		navigate(`/post/${response.id}`)
	})

	useLayoutEffect(() => {
		void loadList(for_type, 1, false)
	}, [])

	useEffect(() => {
		if (!list_map[for_type].inited && !list_map[for_type].loading) {
			void loadList(for_type, 1, false)
		}
	}, [for_type])

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
						active='list'
					></Tabs>
				</div>
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
									className='
										p-3
										rounded-xl
										border border-border-light
										transition-colors
										hover:bg-secondary/70
										cursor-pointer
									'
									onClick={() => navigate(`/post/${item.id}`)}
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
										<span>{item.related_article_count} related</span>
										<span>
											{item.has_session ? 'session ready' : 'no session'}
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
										void loadList(for_type, current_list_state.page + 1, true)
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
			</div>
			<div
				className='
					flex flex-1 flex-col
					items-center justify-center
					gap-4
					text-center
				'
			>
				<div className='text-std-400 text-sm'>Open a post from the list or create a new one.</div>
				<Button onClick={() => void handleCreatePost()}>
					<Plus className='size-4'></Plus>
					<span>New post</span>
				</Button>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by($app.memo).get()
