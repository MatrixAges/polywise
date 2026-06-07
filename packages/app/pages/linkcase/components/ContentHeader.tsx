import { ArrowUpRight, Bot, Database, Globe, Loader, PencilLine, Users } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { Tooltip } from '@/components'

import { useModel } from '../context'
import { getLinkFaviconSrc } from '../types'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('linkcase')
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
				gap-3
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
				<div className='flex flex-1 flex-col truncate'>
					<div
						className='
							flex
							items-center
							gap-0.5
							text-foreground text-sm font-semibold
							truncate
						'
					>
						<span>{item?.title || t('content.select_hint')}</span>
						<a className='icon_button small' target='_blank' href={item?.url || ''}>
							<ArrowUpRight></ArrowUpRight>
						</a>
					</div>
					{item?.url && <div className='text-std-400 truncate text-xs'>{item.url}</div>}
				</div>
			</div>
			<div className='flex shrink-0 items-center gap-2'>
				<Tooltip title={t('control.edit_link')}>
					<div>
						<Button
							className='size-7 px-0'
							variant='outline'
							size='xs'
							disabled={
								!item ||
								Boolean(x.current_ai_fetching_id) ||
								Boolean(x.current_extracting_id) ||
								x.linkcase_session_running
							}
							onClick={x.openEditDialog}
						>
							<PencilLine className='size-3'></PencilLine>
						</Button>
					</div>
				</Tooltip>
				<Tooltip title={t('control.assign_agents')}>
					<div>
						<Button
							className='size-7 px-0'
							variant='outline'
							size='xs'
							disabled={
								!item ||
								!x.detail?.article?.id ||
								Boolean(x.current_ai_fetching_id) ||
								Boolean(x.current_extracting_id) ||
								x.linkcase_session_running
							}
							onClick={() => void x.openAgentDialog()}
						>
							<Users className='size-3'></Users>
						</Button>
					</div>
				</Tooltip>
				<Button
					className='h-7'
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
					<span>{t('control.fetch')}</span>
				</Button>
				<Button
					className='h-7'
					variant='default'
					size='xs'
					disabled={!can_extract || extracting}
					onClick={() => void x.extractSelectedLink()}
				>
					{extracting ? (
						<Loader className='size-3.5 animate-spin'></Loader>
					) : (
						<Database className='size-3.5'></Database>
					)}
					<span>{extracted ? t('control.reextract') : t('selection.extract')}</span>
				</Button>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
