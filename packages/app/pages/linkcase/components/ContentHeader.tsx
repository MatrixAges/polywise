import { Globe, Loader, RefreshCw } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'

import { useModel } from '../context'
import { getLinkFaviconSrc } from '../types'

const Index = () => {
	const x = useModel()
	const item = x.selected_item
	const favicon_src = getLinkFaviconSrc(item?.favicon)
	const has_content = Boolean(x.detail?.article?.content?.trim())

	return (
		<div
			className='
				flex shrink-0
				items-center justify-between
				h-14
				gap-3
				px-5
				border-b border-border-light
			'
		>
			<div className='flex min-w-0 items-center gap-3'>
				<div
					className='
						overflow-hidden
						flex shrink-0
						items-center justify-center
						size-10
						rounded-2xl
						text-std-400
						bg-secondary
					'
				>
					{favicon_src ? (
						<img className='size-full object-cover' src={favicon_src} alt={item?.title || ''} />
					) : (
						<Globe className='size-4'></Globe>
					)}
				</div>
				<div className='min-w-0'>
					<div className='text-foreground truncate text-sm font-semibold'>
						{item?.title || 'Select a link'}
					</div>
					{item?.url && <div className='text-std-400 truncate text-xs'>{item.url}</div>}
				</div>
			</div>
			<div className='flex shrink-0 items-center gap-2'>
				<Button
					variant='secondary'
					size='sm'
					disabled={!item || x.current_fetching_id === item.id}
					onClick={() => x.fetchSelectedLink()}
				>
					{x.current_fetching_id === item?.id ? (
						<Loader className='size-3.5 animate-spin'></Loader>
					) : (
						<RefreshCw className='size-3.5'></RefreshCw>
					)}
					<span>{has_content ? 'Refetch' : 'Fetch'}</span>
				</Button>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
