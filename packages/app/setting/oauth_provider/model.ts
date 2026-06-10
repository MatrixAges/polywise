import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { injectable } from 'tsyringe'

import { rpc } from '@/utils'

import type { Model } from '@core/types'

export type OAuthProvidersResponse = Awaited<ReturnType<typeof rpc.oauth.getAll.query>>
export type OAuthProvider = OAuthProvidersResponse['providers'][number]
export type OAuthProviderId = OAuthProvider['id']

@injectable()
export default class Index {
	providers = [] as Array<OAuthProvider>
	loading = false
	connecting_id = null as OAuthProviderId | null
	syncing_id = null as OAuthProviderId | null
	updating_id = null as OAuthProviderId | null

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	get busy() {
		return this.connecting_id !== null || this.syncing_id !== null || this.updating_id !== null
	}

	async init() {
		await this.refreshProviders()
	}

	async refreshProviders() {
		this.loading = true

		try {
			const res = await rpc.oauth.getAll.query()
			const pending_sync_ids = res.providers
				.filter(item => item.connected && item.sync_supported && !item.synced)
				.map(item => item.id)

			if (pending_sync_ids.length > 0) {
				await Promise.all(
					pending_sync_ids.map(id => rpc.oauth.sync.mutate({ id }).catch(() => undefined))
				)

				const next_res = await rpc.oauth.getAll.query()
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
			const res = await rpc.oauth.sync.mutate({ id })
			toast.success(
				$t('oauth_provider.sync_started', {
					ns: 'setting',
					name: res.synced_provider_name,
					count: res.detected_model_count ?? res.model_count
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
			const res = await rpc.oauth.connect.mutate({ id })
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

	async setProviderEnabled(args: { id: OAuthProviderId; enabled: boolean }) {
		const { id, enabled } = args
		this.updating_id = id

		try {
			await rpc.oauth.setEnabled.mutate({ id, enabled })
			toast.success(
				enabled
					? $t('oauth_provider.provider_enabled', { ns: 'setting' })
					: $t('oauth_provider.provider_disabled', { ns: 'setting' })
			)
			return true
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : $t('oauth_provider.update_failed', { ns: 'setting' })
			)
			return false
		} finally {
			this.updating_id = null
			await this.refreshProviders()
		}
	}

	async saveProviderModels(args: { id: OAuthProviderId; models: Array<Model> }) {
		const { id, models } = args
		this.updating_id = id

		try {
			await rpc.oauth.setModels.mutate({ id, models })
			return true
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : $t('oauth_provider.update_failed', { ns: 'setting' })
			)
			return false
		} finally {
			this.updating_id = null
			await this.refreshProviders()
		}
	}

	async resetProviderModels(id: OAuthProviderId) {
		this.updating_id = id

		try {
			await rpc.oauth.resetModels.mutate({ id })
			toast.success($t('oauth_provider.models_reset_done', { ns: 'setting' }))
			return true
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : $t('oauth_provider.update_failed', { ns: 'setting' })
			)
			return false
		} finally {
			this.updating_id = null
			await this.refreshProviders()
		}
	}
}
