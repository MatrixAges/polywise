import { Bot, Database, Globe, Loader, RefreshCw } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Button } from '@/__shadcn__/components/ui/button'

import { useModel } from '../context'
import { getLinkFaviconSrc } from '../types'

const Index = () => {
	const x = useModel()
	const item = x.selected_item
	const favicon_src = getLinkFaviconSrc(item?.favicon)
	const has_content = Boolean(x.detail?.article?.content?.trim())
	const extracting = x.current_extracting_id === item?.id
	const extracted = Boolean(x.detail?.article?.is_pipelined)
	const can_extract = Boolean(item && item.status === 'success' && has_content)

	return (
		<div
			className='
				flex shrink-0
				items-center justify-between
				h-12
				gap-2
				px-2.5
				border-b border-border-light
			'
		>
			<div className='flex min-w-0 items-center gap-2'>
				<div
					className='
						overflow-hidden
						flex shrink-0
						items-center justify-center
						size-7.5
						p-2
						rounded-2xl
						text-std-400
						bg-secondary
					'
				>
					{favicon_src ? (
						<img className='size-full object-cover' src={favicon_src} alt={item?.title || ''} />
					) : (
						<Globe className='sizefull'></Globe>
					)}
				</div>
				<div className='flex flex-col'>
					<div className='text-foreground truncate text-sm font-semibold'>
						{item?.title || 'Select a link'}
					</div>
					{item?.url && <div className='text-std-400 truncate text-xs'>{item.url}</div>}
				</div>
			</div>
			<div className='flex shrink-0 items-center gap-2'>
				<Button
					variant='outline'
					size='xs'
					disabled={!item || Boolean(x.current_ai_fetching_id) || x.linkcase_session_running}
					onClick={() => void x.fetchSelectedLinkByAI()}
				>
					{x.current_ai_fetching_id === item?.id ? (
						<Loader className='size-3.5 animate-spin'></Loader>
					) : (
						<Bot className='size-3.5'></Bot>
					)}
					<span>AI Fetch</span>
				</Button>
				<Button
					variant='secondary'
					size='xs'
					disabled={!item || x.current_fetching_id === item.id}
					onClick={() => void x.fetchSelectedLink()}
				>
					{x.current_fetching_id === item?.id ? (
						<Loader className='size-3.5 animate-spin'></Loader>
					) : (
						<RefreshCw className='size-3.5'></RefreshCw>
					)}
					<span>{has_content ? 'Refetch' : 'Fetch'}</span>
				</Button>
				<Button
					size='xs'
					className='border-black bg-black text-white hover:bg-black/90'
					disabled={!can_extract || extracting}
					onClick={() => void x.extractSelectedLink()}
				>
					{extracting ? (
						<Loader className='size-3.5 animate-spin'></Loader>
					) : (
						<Database className='size-3.5'></Database>
					)}
					<span>{extracted ? 'Re-extract' : 'Extract'}</span>
				</Button>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
