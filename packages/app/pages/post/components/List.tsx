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
		<div className='flex w-full flex-col'>
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
						<span>{fromNow(item.updated_at)}</span>
						<span>{item.related_article_count} related</span>
					</div>
				</div>
			))}
			{x.current_list_state.loading && x.current_list_state.list.length > 0 ? (
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
