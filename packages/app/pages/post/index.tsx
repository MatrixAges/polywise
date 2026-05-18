import { useEffect, useLayoutEffect, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { Loader2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Button } from '@/__shadcn__/components/ui/button'
import { TextTabs } from '@/components'
import { rpc } from '@/utils'

import { createListStateMap, for_type_tab_items, mergePostList } from './shared'

import type { PostForType } from './shared'

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
		<div className='h-full overflow-y-auto'>
			<div
				className='
					flex flex-col
					w-full
					min-h-full
					py-5
					page_wrap
				'
			>
				<div
					className='
						flex
						items-start justify-between
						gap-4
						mb-5
					'
				>
					<div>
						<div className='text-foreground text-xl font-semibold'>Posts</div>
						<div className='text-std-400 mt-1 text-sm'>
							Browse social posts by source type and continue writing from the detail page.
						</div>
					</div>
					<Button className='shrink-0' onClick={() => void handleCreatePost()}>
						<Plus className='size-4'></Plus>
						<span>New post</span>
					</Button>
				</div>
				<div className='border-border-light bg-background/70 rounded-[28px] border'>
					<div
						className='
							flex
							items-center justify-between
							gap-3
							px-4 py-3
							border-b border-border-light
						'
					>
						<div className='h-8'>
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
						<div className='text-std-400 text-xs'>{current_list_state.list.length} loaded</div>
					</div>
					<div className='flex flex-col gap-2 p-3'>
						{current_list_state.list.length === 0 && !current_list_state.loading ? (
							<div
								className='
									flex
									items-center justify-center
									px-6 py-14
									text-sm text-std-400
									text-center
								'
							>
								No posts yet.
							</div>
						) : (
							<>
								{current_list_state.list.map(item => (
									<div
										className='
											p-4
											rounded-2xl
											bg-background/80
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
												mb-2
											'
										>
											<div className='text-foreground line-clamp-2 text-base font-semibold'>
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
												flex flex-wrap
												items-center
												gap-3
												mt-3
												text-[11px] text-std-300
											'
										>
											<span>{item.related_article_count} related</span>
											<span>
												{item.has_session
													? 'session ready'
													: 'no session'}
											</span>
										</div>
									</div>
								))}
								{current_list_state.loading && current_list_state.list.length > 0 ? (
									<div
										className='
											flex
											items-center justify-center
											gap-2
											px-3 py-2
											text-sm text-std-400
										'
									>
										<Loader2 className='size-4 animate-spin'></Loader2>
										Loading...
									</div>
								) : null}
								{current_list_state.has_more ? (
									<div className='pt-2'>
										<Button
											className='w-full'
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
											{current_list_state.loading ? (
												<Loader2 className='size-3.5 animate-spin'></Loader2>
											) : null}
											<span>Load more</span>
										</Button>
									</div>
								) : null}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export const Component = new $app.Handle(Index).by($app.memo).get()
