import { Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router'

import { Button } from '@/__shadcn__/components/ui/button'
import { fromNow } from '@/utils'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const navigate = useNavigate()

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
				No posts yet.
			</div>
		)
	}

	return (
		<div className='flex w-full flex-col py-2'>
			{x.current_list_state.list.map(item => (
				<div
					className='
						flex flex-col
						py-3
						border-b border-border-light
						group
						cursor-pointer
					'
					onClick={() => navigate(`/post/${item.id}`)}
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
						{item.title || 'Untitled post'}
					</div>
					<div
						className='
							mb-2
							text-std-400 text-sm leading-5
							line-clamp-2
						'
					>
						{item.content_preview || 'Empty content'}
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
							<span>{item.related_article_count} related</span>
						)}
					</div>
				</div>
			))}
			{x.current_list_state.has_more ? (
				<div className='pt-2'>
					<Button
						className='w-full'
						variant='outline'
						size='sm'
						disabled={x.current_list_state.loading}
						onClick={() => void x.loadList(x.for_type, x.current_list_state.page + 1, true)}
					>
						{x.current_list_state.loading ? (
							<Loader2 className='size-3.5 animate-spin'></Loader2>
						) : null}
						<span>Load more</span>
					</Button>
				</div>
			) : null}
		</div>
	)
}

export default observer(Index)
