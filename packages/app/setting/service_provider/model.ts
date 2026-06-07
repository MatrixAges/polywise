import { default_fetch_fallback_chain } from '@core/types'
import { arrayMove } from '@dnd-kit/sortable'
import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { injectable } from 'tsyringe'

import { Setting } from '@/models'
import { rpc } from '@/utils'

import type { AppConfig } from '@core/types'
import type { DragEndEvent } from '@dnd-kit/core'

export type LinkcaseProvidersResponse = Awaited<ReturnType<typeof rpc.linkcase.getContentProviders.query>>
export type LinkcaseProvider = LinkcaseProvidersResponse['providers'][number]
export type LinkcaseProviderId = LinkcaseProvider['id']
export type ManageProviderAction = 'create_profile' | 'recreate_profile'

const getFallbackChain = (config?: Partial<AppConfig> | null) => {
	if (Array.isArray(config?.fetch_fallback_chain) && config.fetch_fallback_chain.length) {
		return config.fetch_fallback_chain
	}

	return [...default_fetch_fallback_chain] as AppConfig['fetch_fallback_chain']
}

const orderProvidersByChain = (
	providers: Array<LinkcaseProvider>,
	fallback_chain: AppConfig['fetch_fallback_chain']
) => {
	const order_map = new Map(fallback_chain.map((id, index) => [id, index]))
	const original_order_map = new Map(providers.map((provider, index) => [provider.id, index]))

	return [...providers].sort((a, b) => {
		const a_index = order_map.get(a.id) ?? Number.MAX_SAFE_INTEGER
		const b_index = order_map.get(b.id) ?? Number.MAX_SAFE_INTEGER

		if (a_index !== b_index) {
			return a_index - b_index
		}

		return (original_order_map.get(a.id) ?? 0) - (original_order_map.get(b.id) ?? 0)
	})
}

const buildNextFallbackChain = (
	ordered_provider_ids: Array<LinkcaseProviderId>,
	current_chain: AppConfig['fetch_fallback_chain']
) => {
	const ordered_provider_id_set = new Set<LinkcaseProviderId>(ordered_provider_ids)
	const hidden_provider_ids = current_chain.filter(item => !ordered_provider_id_set.has(item as LinkcaseProviderId))

	return [...ordered_provider_ids, ...hidden_provider_ids] as AppConfig['fetch_fallback_chain']
}

@injectable()
export default class Index {
	providers = [] as Array<LinkcaseProvider>
	loading = false
	installing_id = null as string | null
	managing_action_id = null as string | null

	constructor(public setting: Setting) {
		makeAutoObservable(this, { setting: false }, { autoBind: true })
	}

	get current_config() {
		return (this.setting.config ? $copy(this.setting.config) : {}) as Partial<AppConfig>
	}

	get fallback_chain() {
		return getFallbackChain(this.current_config)
	}

	get fallback_chain_key() {
		return this.fallback_chain.join('|')
	}

	get drag_disabled() {
		return this.loading || this.installing_id !== null || this.managing_action_id !== null
	}

	get form_values() {
		return {
			...this.current_config,
			fetch_fallback_chain: this.fallback_chain,
			enbale_webfetch_chain: this.current_config.enbale_webfetch_chain ?? false
		} as AppConfig
	}

	async init() {
		await this.refreshProviders(false)
	}

	onConfigChange(values: AppConfig) {
		this.setting.setConfig('config', values)
	}

	syncProviderOrder() {
		this.providers = orderProvidersByChain(this.providers, this.fallback_chain)
	}

	async refreshProviders(probe_runtime = false) {
		this.loading = true

		try {
			const res = await rpc.linkcase.getContentProviders.query({ probe_runtime })
			this.providers = orderProvidersByChain(res.providers, this.fallback_chain)
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: $t('service_provider.load_failed', {
							ns: 'setting',
							defaultValue: 'Failed to load Linkcase providers'
						})
			)
		} finally {
			this.loading = false
		}
	}

	async installProvider(id: LinkcaseProviderId) {
		this.installing_id = id

		try {
			await rpc.linkcase.installContentProvider.mutate({ id })
			toast.success($t('service_provider.installed', { ns: 'setting' }))
			await this.refreshProviders(false)
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: $t('service_provider.install_failed', {
							ns: 'setting',
							defaultValue: 'Install failed'
						})
			)
		} finally {
			this.installing_id = null
		}
	}

	async manageProvider(action: ManageProviderAction) {
		const action_id = `crawl4ai:${action}`

		this.managing_action_id = action_id

		try {
			const res = await rpc.linkcase.manageContentProvider.mutate({ id: 'crawl4ai', action })
			toast.success(
				res.created
					? action === 'recreate_profile'
						? $t('service_provider.crawl4ai_recreated', {
								ns: 'setting',
								defaultValue: 'Crawl4AI profile recreated from current Chrome session'
							})
						: $t('service_provider.crawl4ai_created', {
								ns: 'setting',
								defaultValue: 'Crawl4AI profile created from current Chrome session'
							})
					: $t('service_provider.crawl4ai_exists', {
							ns: 'setting',
							defaultValue: 'Crawl4AI profile already exists'
						})
			)
			await this.refreshProviders(false)
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: $t('service_provider.action_failed', {
							ns: 'setting',
							defaultValue: 'Provider action failed'
						})
			)
		} finally {
			this.managing_action_id = null
		}
	}

	handleProviderDragEnd(event: DragEndEvent) {
		const { active, over } = event

		if (!over?.id || active.id === over.id) {
			return
		}

		const from = this.providers.findIndex(item => item.id === active.id)
		const to = this.providers.findIndex(item => item.id === over.id)

		if (from < 0 || to < 0) {
			return
		}

		const next_providers = arrayMove(this.providers, from, to)
		const next_chain = buildNextFallbackChain(
			next_providers.map(item => item.id),
			this.fallback_chain
		)

		this.providers = next_providers
		this.setting.setConfig('config', { fetch_fallback_chain: next_chain } as AppConfig, true)
	}
}
