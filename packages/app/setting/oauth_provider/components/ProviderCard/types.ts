import type { Model } from '@core/types'
import type { OAuthProvider, OAuthProviderId } from '../../model'

export type ProviderCardProps = {
	provider: OAuthProvider
	connecting_id: OAuthProviderId | null
	syncing_id: OAuthProviderId | null
	updating_id: OAuthProviderId | null
	onConnect: (id: OAuthProviderId) => Promise<void>
	onSync: (id: OAuthProviderId) => Promise<void>
	onToggleEnabled: (args: { id: OAuthProviderId; enabled: boolean }) => Promise<boolean>
	onSaveModels: (args: { id: OAuthProviderId; models: Array<Model> }) => Promise<boolean>
	onResetModels: (id: OAuthProviderId) => Promise<boolean>
}
