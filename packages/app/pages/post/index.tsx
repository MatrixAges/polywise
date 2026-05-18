import { useEffect, useRef } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router'
import { container } from 'tsyringe'

import { Button } from '@/__shadcn__/components/ui/button'
import { TextTabs } from '@/components'

import { Context, useModel } from './context'
import Model from './model'
import { for_type_tab_items } from './shared'

import type { PostForType } from './shared'

const Content = observer(() => {
	const x = useModel()
	const navigate = useNavigate()

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
					<Button
						className='shrink-0'
						onClick={async () => {
							const id = await x.createPost()

							if (id) {
								navigate(`/post/${id}`)
							}
						}}
					>
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
								active={x.for_type}
								setActive={(value: PostForType) => x.setForType(value)}
							></TextTabs>
						</div>
						<div className='text-std-400 text-xs'>
							{x.current_list_state.list.length} loaded
						</div>
					</div>
					<div className='flex flex-col gap-2 p-3'>
						{x.current_list_state.list.length === 0 && !x.current_list_state.loading ? (
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
								{x.current_list_state.list.map(item => (
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
								{x.current_list_state.loading &&
								x.current_list_state.list.length > 0 ? (
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
								{x.current_list_state.has_more ? (
									<div className='pt-2'>
										<Button
											className='w-full'
											variant='outline'
											size='sm'
											disabled={x.current_list_state.loading}
											onClick={() =>
												void x.loadList(
													x.for_type,
													x.current_list_state.page + 1,
													true
												)
											}
										>
											{x.current_list_state.loading ? (
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
})

const Index = () => {
	const ref_model = useRef<Model | null>(null)

	if (!ref_model.current) {
		ref_model.current = container.resolve(Model)
	}

	const x = ref_model.current

	useEffect(() => {
		void x.init()

		return () => x.deinit()
	}, [x])

	return (
		<Context value={x}>
			<Content></Content>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
