import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

export type OAuthProvidersResponse = Awaited<ReturnType<typeof rpc.oauthProvider.getAll.query>>
export type OAuthProvider = OAuthProvidersResponse['providers'][number]
export type OAuthProviderId = OAuthProvider['id']

@injectable()
export default class Index {
	providers = [] as Array<OAuthProvider>
	loading = false
	connecting_id = null as OAuthProviderId | null
	syncing_id = null as OAuthProviderId | null

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	async init() {
		await this.refreshProviders()
	}

	async refreshProviders() {
		this.loading = true

		try {
			const res = await rpc.oauthProvider.getAll.query()
			const pending_sync_ids = res.providers
				.filter(item => item.connected && item.sync_supported && !item.synced)
				.map(item => item.id)

			if (pending_sync_ids.length > 0) {
				await Promise.all(
					pending_sync_ids.map(id => rpc.oauthProvider.sync.mutate({ id }).catch(() => undefined))
				)

				const next_res = await rpc.oauthProvider.getAll.query()
				this.providers = next_res.providers
				return
			}

			this.providers = res.providers
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : $t('oauth_provider.load_failed', { ns: 'setting' })
			)
		} finally {
			this.loading = false
		}
	}

	async syncProvider(id: OAuthProviderId) {
		this.syncing_id = id

		try {
			const res = await rpc.oauthProvider.sync.mutate({ id })
			toast.success(
				$t('oauth_provider.sync_started', {
					ns: 'setting',
					name: res.synced_provider_name,
					count: res.model_count
				})
			)
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : $t('oauth_provider.sync_failed', { ns: 'setting' })
			)
		} finally {
			this.syncing_id = null
			await this.refreshProviders()
		}
	}

	async connectProvider(id: OAuthProviderId) {
		this.connecting_id = id

		try {
			const res = await rpc.oauthProvider.connect.mutate({ id })
			toast.success($t('oauth_provider.connect_started', { ns: 'setting', name: res.provider.name }))
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : $t('oauth_provider.connect_failed', { ns: 'setting' })
			)
		} finally {
			this.connecting_id = null
			await this.refreshProviders()
		}
	}
}
