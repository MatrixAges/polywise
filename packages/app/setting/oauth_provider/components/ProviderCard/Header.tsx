import { SquareArrowOutUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Spinner } from '@/__shadcn__/components/ui/spinner'

import { getDescription, getStatusText, getStatusVariant } from './helpers'

import type { ProviderCardProps } from './types'

type HeaderProps = Pick<
	ProviderCardProps,
	'provider' | 'connecting_id' | 'syncing_id' | 'updating_id' | 'onConnect' | 'onSync'
>

const Index = (props: HeaderProps) => {
	const { provider, connecting_id, syncing_id, updating_id, onConnect, onSync } = props
	const { t } = useTranslation('setting')
	const actions_disabled = connecting_id !== null || syncing_id !== null || updating_id !== null

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex flex-col gap-2'>
					<div className='flex flex-wrap items-center gap-2'>
						<span className='font-medium'>{provider.name}</span>
						<Badge variant='outline'>{provider.client}</Badge>
						<Badge variant={getStatusVariant(provider)}>{getStatusText({ provider, t })}</Badge>
						{provider.editable ? (
							<Badge variant={provider.enabled ? 'secondary' : 'outline'}>
								{provider.enabled
									? t('oauth_provider.enabled')
									: t('oauth_provider.disabled')}
							</Badge>
						) : null}
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
					<div className='text-std-500 text-sm'>{getDescription({ provider, t })}</div>
				</div>
				<Button
					type='button'
					variant={provider.connected ? 'outline' : 'default'}
					size='sm'
					disabled={!provider.installed || actions_disabled}
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
						disabled={!provider.connected || actions_disabled}
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
		</div>
	)
}

export default Index
