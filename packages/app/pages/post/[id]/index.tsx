import { useEffect, useRef } from 'react'
import { ArrowLeft, Bot, Database, Loader2, Plus, Save, Trash2, X } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useParams } from 'react-router'
import { container } from 'tsyringe'

import { Button } from '@/__shadcn__/components/ui/button'
import { Input } from '@/__shadcn__/components/ui/input'
import { Session, TextTabs } from '@/components'
import Editor from '@/components/Editor'

import { detail_tab_items, for_type_tab_items } from '../shared'
import { Context, useModel } from './context'
import Model from './model'

import type { Editor as TiptapEditor } from '@tiptap/core'
import type { DetailTab, PostForType } from '../shared'

const Content = observer(() => {
	const x = useModel()
	const navigate = useNavigate()

	if (x.not_found) {
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
					{x.selected_post ? (
						<div className='h-full'>
							<TextTabs
								items={detail_tab_items.map(item => ({
									key: item.key,
									title: item.title,
									Icon: item.Icon
								}))}
								active={x.detail_tab}
								setActive={(value: DetailTab) => x.setDetailTab(value)}
							></TextTabs>
						</div>
					) : (
						<span className='text-std-400 text-sm'>Loading post</span>
					)}
				</div>
				<div className='min-h-0 flex-1 overflow-hidden'>
					{!x.selected_post ? (
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
							{x.post_loading ? 'Loading post...' : 'Select a post from the list.'}
						</div>
					) : x.detail_tab === 'outline' ? (
						<div className='h-full overflow-y-auto p-2.5'>
							{x.outline_items.length === 0 ? (
								<div className='text-std-400 px-3 py-4 text-sm'>
									No markdown headings yet.
								</div>
							) : (
								<div className='flex flex-col gap-1.5'>
									{x.outline_items.map(item => (
										<div
											className='
													px-3 py-2
													rounded-lg
													text-sm text-foreground
													hover:bg-secondary
													cursor-pointer
												'
											style={{ paddingLeft: 12 + (item.level - 1) * 14 }}
											onClick={() => x.scrollToOutlineItem(item)}
											key={item.id}
										>
											{item.text}
										</div>
									))}
								</div>
							)}
						</div>
					) : x.detail_tab === 'related' ? (
						<div className='flex h-full flex-col overflow-hidden'>
							<div className='border-border-light border-b p-2.5'>
								<div className='relative'>
									<Input
										className='pl-8'
										placeholder='Search article to relate'
										value={x.related_search}
										onChange={event => x.setRelatedSearch(event.target.value)}
									></Input>
									{x.related_search ? (
										<button
											className='
														absolute
														top-2.5 right-2.5
														text-std-300
														hover:text-foreground
													'
											onClick={() => x.clearRelatedSearch()}
										>
											<X className='size-4'></X>
										</button>
									) : null}
								</div>
								{x.related_search.trim() ? (
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
										{x.related_search_loading ? (
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
										) : x.related_search_list.length === 0 ? (
											<div className='text-std-400 px-2 py-2 text-sm'>
												No matches.
											</div>
										) : (
											x.related_search_list.map(item => (
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
															void x.addRelatedArticle(
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
								{x.related_loading ? (
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
								) : x.related_articles.length === 0 ? (
									<div className='text-std-400 px-3 py-4 text-sm'>
										No related articles.
									</div>
								) : (
									<div className='flex flex-col gap-2'>
										{x.related_articles.map(item => (
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
															void x.removeRelatedArticle(
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
					) : x.session_id ? (
						<Session
							type='global'
							id={x.session_id}
							draft_input={x.session_draft_input ?? undefined}
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
							<Button disabled={x.ensuring_session} onClick={() => void x.ensureSession()}>
								{x.ensuring_session && (
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
				{x.selected_post ? (
					<>
						<div className='border-border-light border-b px-4 py-3'>
							<div className='flex items-center gap-3'>
								<Input
									className='h-9 flex-1 text-base font-semibold'
									placeholder='Untitled post'
									value={x.draft_title}
									onChange={event => x.setDraftTitle(event.target.value)}
									onBlur={() => void x.saveCurrentPost({ silent: true })}
								></Input>
								<Button
									className='h-9'
									variant='outline'
									disabled={!x.dirty || x.saving}
									onClick={() => void x.saveCurrentPost()}
								>
									{x.saving ? (
										<Loader2 className='size-4 animate-spin'></Loader2>
									) : (
										<Save className='size-4'></Save>
									)}
									<span>{x.saving ? 'Saving' : 'Save'}</span>
								</Button>
								<Button
									className='h-9'
									variant='outline'
									disabled={x.extracting || x.post_loading}
									onClick={() => void x.extractPost()}
								>
									{x.extracting ? (
										<Loader2 className='size-4 animate-spin'></Loader2>
									) : (
										<Database className='size-4'></Database>
									)}
									<span>
										{x.selected_post.is_pipelined ? 'Re-extract' : 'Extract'}
									</span>
								</Button>
								<Button
									className='h-9'
									variant='outline'
									disabled={x.saving || x.extracting}
									onClick={async () => {
										if (await x.deletePost()) {
											navigate('/post')
										}
									}}
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
										active={x.draft_for_type}
										setActive={(value: PostForType) => x.setDraftForType(value)}
									></TextTabs>
								</div>
								<div className='text-std-400 text-xs'>
									{x.dirty ? 'Unsaved changes' : 'Saved'}
								</div>
							</div>
						</div>
						<div className='min-h-0 flex-1 overflow-hidden' ref={x.setEditorArea}>
							{x.post_loading ? (
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
									id={x.selected_post.id}
									value={x.draft_content}
									className='min-h-full px-5 py-4'
									rich_text
									onChange={value => x.setDraftContent(value)}
									onBlur={() => void x.saveCurrentPost({ silent: true })}
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
												void x.addReferenceToPostSessionInput(
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
})

const Index = () => {
	const params = useParams()
	const route_post_id = params.id ?? ''
	const ref_model = useRef<Model | null>(null)

	if (!ref_model.current) {
		ref_model.current = container.resolve(Model)
	}

	const x = ref_model.current

	useEffect(() => {
		void x.init()

		return () => x.deinit()
	}, [x])

	useEffect(() => {
		void x.setRoutePostId(route_post_id)
	}, [route_post_id, x])

	return (
		<Context value={x}>
			<Content></Content>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
