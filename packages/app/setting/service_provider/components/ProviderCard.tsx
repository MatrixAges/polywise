import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDownToLine, GripVertical, SquareArrowOutUpRight } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Spinner } from '@/__shadcn__/components/ui/spinner'

import type { LinkcaseProvider, LinkcaseProviderId, ManageProviderAction } from '../model'

type ProviderCardProps = {
	provider: LinkcaseProvider
	drag_disabled: boolean
	installing_id: string | null
	managing_action_id: string | null
	onInstall: (id: LinkcaseProviderId) => Promise<void>
	onManage: (action: ManageProviderAction) => Promise<void>
}

const getProviderStatusText = (provider: LinkcaseProvider) => {
	if (!provider.installed) return 'status_not_installed'
	if (provider.runtime_probe_deferred) return 'status_check_on_refresh'
	return provider.ready ? 'status_ready' : 'status_needs_setup'
}

const getProviderStatusVariant = (provider: LinkcaseProvider) => {
	if (!provider.installed) return 'outline'
	if (provider.runtime_probe_deferred) return 'outline'
	return provider.ready ? 'secondary' : 'destructive'
}

const getCheckStatusVariant = (status: LinkcaseProvider['checks'][number]['status']) => {
	if (status === 'ok') return 'secondary'
	if (status === 'warning') return 'destructive'
	if (status === 'missing') return 'outline'
	return 'outline'
}

const Index = (props: ProviderCardProps) => {
	const { provider, drag_disabled, installing_id, managing_action_id, onInstall, onManage } = props
	const { t } = useTranslation('setting')
	const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
		id: provider.id,
		disabled: drag_disabled
	})

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={`
				flex flex-col
				gap-2
				px-4 py-3
				rounded-2xl
				bg-muted/40
				group
				${isDragging ? 'dragging z-10 backdrop-blur-lg' : ''}
			`}
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex flex-col gap-2'>
					<div className='flex flex-wrap items-center gap-2'>
						<span className='font-medium'>{provider.name}</span>
						<Badge variant={getProviderStatusVariant(provider)}>
							{t(`service_provider.${getProviderStatusText(provider)}`)}
						</Badge>
						<a
							className='
								text-std-400 text-xs
								underline
								decoration-std-150 underline-offset-4
							'
							href={provider.docs_url}
							target='_blank'
						>
							{t('service_provider.installation_docs')}
						</a>
					</div>
					<div className='text-std-500 text-sm'>{provider.description}</div>
				</div>
				<div className='flex items-center gap-2'>
					<Button
						type='button'
						variant={provider.installed ? 'outline' : 'default'}
						size='sm'
						disabled={
							provider.installed ||
							installing_id === provider.id ||
							managing_action_id !== null
						}
						onClick={() => void onInstall(provider.id)}
					>
						{installing_id === provider.id ? (
							<Spinner className='size-4' />
						) : (
							<ArrowDownToLine className='size-4' />
						)}
						<span>
							{provider.installed
								? t('service_provider.installed')
								: t('service_provider.install')}
						</span>
					</Button>
					<button
						type='button'
						aria-label={`Drag to reorder ${provider.name}`}
						className={`
							active:cursor-grabbing
							icon_button small cursor-grab
							${isDragging ? 'opacity-100' : ''}
						`}
						disabled={drag_disabled}
						{...attributes}
						{...listeners}
					>
						<GripVertical className='size-3.5' />
					</button>
				</div>
			</div>
			{provider.id === 'crawl4ai' && provider.installed ? (
				<div className='flex flex-wrap gap-2'>
					<Button
						type='button'
						variant='outline'
						size='sm'
						disabled={
							!provider.crawl4ai_profile?.preferred_source_profile_name ||
							Boolean(provider.crawl4ai_profile?.managed_profile_exists) ||
							managing_action_id !== null
						}
						onClick={() => void onManage('create_profile')}
					>
						{managing_action_id === 'crawl4ai:create_profile' ? (
							<Spinner className='size-4' />
						) : null}
						<span>{t('service_provider.create_from_chrome')}</span>
					</Button>
					<Button
						type='button'
						variant='outline'
						size='sm'
						disabled={
							!provider.crawl4ai_profile?.preferred_source_profile_name ||
							!provider.crawl4ai_profile?.managed_profile_exists ||
							managing_action_id !== null
						}
						onClick={() => void onManage('recreate_profile')}
					>
						{managing_action_id === 'crawl4ai:recreate_profile' ? (
							<Spinner className='size-4' />
						) : null}
						<span>{t('service_provider.recreate_profile')}</span>
					</Button>
				</div>
			) : null}
			{provider.checks.length > 0 ? (
				<div
					className='
						flex flex-col
						gap-2
						p-3
						rounded-xl
						bg-background/70
						border border-border/60
					'
				>
					{provider.checks.map(check => (
						<div
							key={`${provider.id}-${check.id}`}
							className='
								flex flex-wrap
								items-start justify-between
								gap-3
							'
						>
							<div className='flex min-w-0 flex-col gap-1'>
								<div className='flex flex-wrap items-center gap-2'>
									<span className='text-sm font-medium'>{check.label}</span>
									<Badge variant={getCheckStatusVariant(check.status)}>
										{check.status}
									</Badge>
								</div>
								<div className='text-std-500 text-sm wrap-break-word whitespace-pre-wrap'>
									{check.detail}
								</div>
							</div>
							{check.action_url && check.action_label ? (
								<a
									className='
										inline-flex
										items-center
										gap-1
										text-std-400 text-xs
										underline
										decoration-std-150 underline-offset-4
									'
									href={check.action_url}
									target='_blank'
								>
									<span>{check.action_label}</span>
									<SquareArrowOutUpRight className='size-3' />
								</a>
							) : null}
						</div>
					))}
				</div>
			) : null}
		</div>
	)
}

export default observer(Index)
