import { Database, Loader2, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '@/__shadcn__/components/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger
} from '@/__shadcn__/components/ui/context-menu'
import { fromNow } from '@/utils'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('post')
	const navigate = useNavigate()
	const menu_target = x.menu_target_item

	if (x.current_list_state.list.length === 0 && !x.current_list_state.loading) {
		return (
			<div
				className='
					flex
					items-center justify-center
					px-6 py-14
					text-sm text-std-400
					text-center
				'
			>
				{t('list.no_posts')}
			</div>
		)
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger className='w-full'>
				<div className='flex w-full flex-col py-2' onContextMenuCapture={x.onListContextCapture}>
					{x.current_list_state.list.map((item, index) => {
						const removing = x.removing_post_id === item.id
						const action_disabled = Boolean(x.extracting_post_id || x.removing_post_id)

						return (
							<div
								className={`
								flex flex-col
								py-3
								border-b border-border-light
								group
								${action_disabled ? 'cursor-progress' : 'cursor-pointer'}
									${removing ? 'opacity-60' : ''}
								`}
								onClick={() => {
									if (!action_disabled) {
										navigate(`/post/${item.id}`)
									}
								}}
								data-index={index}
								key={item.id}
							>
								<div
									className='
									mb-1
									text-foreground text-base font-medium
									group-hover:underline
									line-clamp-1
								'
								>
									{item.title || t('detail.untitled_post')}
								</div>
								<div
									className='
									mb-2
									text-std-400 text-sm leading-5
									line-clamp-2
								'
								>
									{item.content_preview || t('list.empty_content')}
								</div>
								<div
									className='
									flex
									items-center justify-between
									gap-3
									text-[11px] text-std-300
								'
								>
									<span>{fromNow(item.updated_at)}</span>
									{item.related_article_count > 0 && (
										<span>
											{t('list.related', {
												count: item.related_article_count
											})}
										</span>
									)}
								</div>
							</div>
						)
					})}
					{x.current_list_state.has_more ? (
						<div className='pt-2'>
							<Button
								className='w-full'
								variant='outline'
								size='sm'
								disabled={x.current_list_state.loading}
								onClick={() =>
									void x.loadList(x.active_tab, x.current_list_state.page + 1, true)
								}
							>
								{x.current_list_state.loading ? (
									<Loader2 className='size-3.5 animate-spin'></Loader2>
								) : null}
								<span>{t('list.load_more')}</span>
							</Button>
						</div>
					) : null}
				</div>
			</ContextMenuTrigger>
			{menu_target ? (
				<ContextMenuContent>
					<ContextMenuItem
						disabled={Boolean(x.extracting_post_id || x.removing_post_id)}
						onClick={() => void x.extractPost(menu_target)}
					>
						{x.extracting_post_id === menu_target.id ? (
							<Loader2 className='animate-spin'></Loader2>
						) : (
							<Database></Database>
						)}
						<span>{menu_target.is_pipelined ? t('list.reextract') : t('list.extract')}</span>
					</ContextMenuItem>
					<ContextMenuSeparator></ContextMenuSeparator>
					<ContextMenuItem
						variant='destructive'
						disabled={Boolean(x.extracting_post_id || x.removing_post_id)}
						onClick={() => void x.removePost(menu_target)}
					>
						{x.removing_post_id === menu_target.id ? (
							<Loader2 className='animate-spin'></Loader2>
						) : (
							<Trash2></Trash2>
						)}
						<span>{t('list.remove')}</span>
					</ContextMenuItem>
				</ContextMenuContent>
			) : null}
		</ContextMenu>
	)
}

export default observer(Index)
