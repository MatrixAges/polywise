import { SquareArrowOutUpRight } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Spinner } from '@/__shadcn__/components/ui/spinner'

import type { OAuthProvider, OAuthProviderId } from '../model'

type ProviderCardProps = {
	provider: OAuthProvider
	connecting_id: OAuthProviderId | null
	syncing_id: OAuthProviderId | null
	onConnect: (id: OAuthProviderId) => Promise<void>
	onSync: (id: OAuthProviderId) => Promise<void>
}

const getStatusVariant = (provider: OAuthProvider) => {
	if (!provider.installed) return 'outline'
	if (provider.sync_supported && provider.connected && !provider.synced) return 'outline'
	if (!provider.connected) return 'destructive'
	return 'secondary'
}

const getStatusText = (args: { provider: OAuthProvider; t: ReturnType<typeof useTranslation<'setting'>>['t'] }) => {
	const { provider, t } = args

	if (!provider.installed) return t('oauth_provider.status_not_installed')
	if (!provider.connected) return t('oauth_provider.status_disconnected')
	if (provider.sync_supported && !provider.synced) return t('oauth_provider.status_needs_sync')
	return t('oauth_provider.status_connected')
}

const getDescription = (args: { provider: OAuthProvider; t: ReturnType<typeof useTranslation<'setting'>>['t'] }) => {
	const { provider, t } = args

	switch (provider.id) {
		case 'codex':
			return t('oauth_provider.provider_codex_desc')
		case 'opencode-go':
			return t('oauth_provider.provider_opencode_go_desc')
		case 'opencode-zen':
			return t('oauth_provider.provider_opencode_zen_desc')
	}
}

const getDetail = (args: { provider: OAuthProvider; t: ReturnType<typeof useTranslation<'setting'>>['t'] }) => {
	const { provider, t } = args

	if (!provider.installed) {
		return t('oauth_provider.cli_missing', { client: provider.client })
	}

	if (provider.connected) {
		if (provider.id === 'codex' && !provider.sync_supported) {
			return t('oauth_provider.connection_codex_pending', {
				label: provider.credential_label || provider.name
			})
		}

		if (provider.sync_supported && !provider.synced) {
			return t('oauth_provider.connection_ready_needs_sync', {
				label: provider.credential_label || provider.name
			})
		}

		if (provider.sync_supported && provider.synced) {
			return t('oauth_provider.connection_synced', {
				count: provider.synced_model_count,
				name: provider.sync_provider_name || provider.name
			})
		}

		return provider.credential_label
			? t('oauth_provider.connection_ready', { label: provider.credential_label })
			: t('oauth_provider.connection_ready_fallback')
	}

	return t('oauth_provider.connection_missing', { client: provider.client })
}

const Index = (props: ProviderCardProps) => {
	const { provider, connecting_id, syncing_id, onConnect, onSync } = props
	const { t } = useTranslation('setting')

	return (
		<div
			className='
				flex flex-col
				gap-2
				px-4 py-3
				rounded-2xl
				bg-muted/40
			'
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex flex-col gap-2'>
					<div className='flex flex-wrap items-center gap-2'>
						<span className='font-medium'>{provider.name}</span>
						<Badge variant='outline'>{provider.client}</Badge>
						<Badge variant={getStatusVariant(provider)}>{getStatusText({ provider, t })}</Badge>
						{provider.sync_supported ? (
							<Badge variant={provider.synced ? 'secondary' : 'outline'}>
								{provider.synced
									? t('oauth_provider.models_synced', {
											count: provider.synced_model_count
										})
									: t('oauth_provider.models_not_synced')}
							</Badge>
						) : null}
						<a
							className='
								text-std-400 text-xs
								underline
								decoration-std-150 underline-offset-4
							'
							href={provider.docs_url}
							target='_blank'
						>
							{t('oauth_provider.open_docs')}
						</a>
					</div>
					<div className='text-std-500 text-sm'>
						{getDescription({ provider, t }) || provider.description}
					</div>
				</div>
				<Button
					type='button'
					variant={provider.connected ? 'outline' : 'default'}
					size='sm'
					disabled={!provider.installed || connecting_id !== null || syncing_id !== null}
					onClick={() => void onConnect(provider.id)}
				>
					{connecting_id === provider.id ? <Spinner className='size-4' /> : null}
					<span>
						{provider.connected ? t('oauth_provider.reconnect') : t('oauth_provider.connect')}
					</span>
				</Button>
			</div>
			{provider.sync_supported ? (
				<div className='flex flex-wrap gap-2'>
					<Button
						type='button'
						variant='outline'
						size='sm'
						disabled={!provider.connected || syncing_id !== null || connecting_id !== null}
						onClick={() => void onSync(provider.id)}
					>
						{syncing_id === provider.id ? <Spinner className='size-4' /> : null}
						<span>
							{provider.synced
								? t('oauth_provider.resync_models')
								: t('oauth_provider.sync_models')}
						</span>
					</Button>
				</div>
			) : null}
			<div
				className='
					flex flex-wrap
					items-start justify-between
					gap-3
					p-3
					rounded-xl
					bg-background/70
					border border-border/60
				'
			>
				<div className='flex min-w-0 flex-col gap-1'>
					<div className='text-sm font-medium'>{t('oauth_provider.detected_via')}</div>
					<div className='text-std-500 text-sm wrap-break-word whitespace-pre-wrap'>
						{getDetail({ provider, t })}
					</div>
					{provider.synced_models?.length ? (
						<div className='mt-2 flex flex-wrap gap-1.5'>
							{provider.synced_models.map(model => (
								<Badge variant='outline' key={`${provider.id}-${model}`}>
									{model}
								</Badge>
							))}
						</div>
					) : null}
				</div>
				<a
					className='
						inline-flex
						items-center
						gap-1
						text-std-400 text-xs
						underline
						decoration-std-150 underline-offset-4
					'
					href={provider.docs_url}
					target='_blank'
				>
					<span>{t('oauth_provider.open_docs')}</span>
					<SquareArrowOutUpRight className='size-3' />
				</a>
			</div>
		</div>
	)
}

export default observer(Index)
