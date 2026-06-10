import { useTranslation } from 'react-i18next'

import type { OAuthProvider } from '../../model'

export const model_types = ['text', 'embedding', 'rerank', 'image', 'audio', 'video'] as const

export const getStatusVariant = (provider: OAuthProvider) => {
	if (!provider.installed) return 'outline'
	if (provider.sync_supported && provider.connected && !provider.synced) return 'outline'
	if (!provider.connected) return 'destructive'
	return 'secondary'
}

export const getStatusText = (args: {
	provider: OAuthProvider
	t: ReturnType<typeof useTranslation<'setting'>>['t']
}) => {
	const { provider, t } = args

	if (!provider.installed) return t('oauth_provider.status_not_installed')
	if (!provider.connected) return t('oauth_provider.status_disconnected')
	if (provider.sync_supported && !provider.synced) return t('oauth_provider.status_needs_sync')
	return t('oauth_provider.status_connected')
}

export const getDescription = (args: {
	provider: OAuthProvider
	t: ReturnType<typeof useTranslation<'setting'>>['t']
}) => {
	const { provider, t } = args

	const description_map = {
		codex: t('oauth_provider.provider_codex_desc'),
		'opencode-go': t('oauth_provider.provider_opencode_go_desc'),
		'opencode-zen': t('oauth_provider.provider_opencode_zen_desc')
	} satisfies Record<OAuthProvider['id'], string>

	return description_map[provider.id]
}

export const getDetail = (args: { provider: OAuthProvider; t: ReturnType<typeof useTranslation<'setting'>>['t'] }) => {
	const { provider, t } = args

	if (!provider.installed) {
		return t('oauth_provider.cli_missing', { client: provider.client })
	}

	if (provider.connected) {
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
