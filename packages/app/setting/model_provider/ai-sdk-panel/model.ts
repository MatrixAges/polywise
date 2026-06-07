import { arrayMove } from '@dnd-kit/sortable'
import { deepmerge } from 'deepmerge-ts'
import { differenceBy } from 'es-toolkit'
import { validate } from 'jsonschema'
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { alert, downloadFile, rpc, uploadFile } from '@/utils'

import schema from './schema.json'

import type { ConfigProvider, ProviderConfig } from '@core/types'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ArgsInit, IPropsPanel } from './types'

@injectable()
export default class Index {
	config = null as ProviderConfig | null
	current_tab = 0
	current_model = null as number | null
	adding_model = false
	adding_provider = false
	all_providers = [] as Array<ConfigProvider>

	onChange: IPropsPanel['onChange'] = () => undefined

	get providers() {
		const enabled = [] as Array<ConfigProvider>
		const disabled = [] as Array<string>

		this.config?.providers.forEach(item => {
			if (item.enabled) {
				enabled.push(item)
			} else {
				disabled.push(item.name)
			}
		})

		return { enabled, disabled }
	}

	get builtin_providers() {
		return differenceBy(this.all_providers, this.config?.providers || [], item => item.name)
	}

	get tabs() {
		if (!this.providers.enabled) return []

		return this.providers.enabled.map(item => item.name).concat('custom', 'disabled')
	}

	get provider() {
		return this.providers.enabled?.[this.current_tab]!
	}

	constructor() {
		makeAutoObservable(this, { all_providers: false }, { autoBind: true })
	}

	async init(args: ArgsInit) {
		const { config, onChange } = args

		await this.getAll()

		this.config = config

		this.onChange = onChange
	}

	async getAll() {
		this.all_providers = await rpc.provider.getAll.query()
	}

	setEnabledProvider(v: Partial<ConfigProvider>) {
		const name = this.providers.enabled[this.current_tab].name
		const index = this.config!.providers.findIndex(item => item.name === name)!

		this.config!.providers[index] = { ...this.config!.providers[index], ...v }
	}

	onChangeCurrentTab(v: number) {
		this.current_model = null
		this.adding_model = false
		this.current_tab = v
	}

	onChangeProvider(v: Index['provider']) {
		this.setEnabledProvider(v)

		this.onChangeConfig()
	}

	onToggleProvider() {
		if (this.providers.enabled!.length <= 3) return

		this.setEnabledProvider({ enabled: false })

		if (this.current_tab === this.providers.enabled!.length) {
			this.current_tab = this.current_tab - 1
		}

		this.onChangeConfig()
	}

	onEnableProvider(name: string) {
		const index = this.config!.providers.findIndex(item => item.name === name)!

		this.config!.providers[index].enabled = true
		this.current_tab += 1

		this.onChangeConfig()
	}

	onDragProvider(args: DragEndEvent) {
		const { active, over } = args

		if (!over?.id || active.id === over.id) return

		const providers = this.config!.providers

		const active_index = providers.findIndex(item => item.name === active.id)
		const over_index = providers.findIndex(item => item.name === over.id)

		const current_tab_name = this.tabs[this.current_tab]

		this.config!.providers = arrayMove(providers, active_index, over_index)

		this.current_tab = this.tabs.findIndex(item => item === current_tab_name)

		this.onChangeConfig()
	}

	onAddBuiltinProvider(index: number | null) {
		if (index === null || !this.config) return

		this.config.providers.push(this.builtin_providers[index])

		this.config.providers = $copy(this.config.providers)
	}

	onChangeCustomProviders(v: ProviderConfig['custom_providers']) {
		this.config!.custom_providers = v

		this.onChangeConfig()
	}

	onChangeConfig() {
		this.onChange($copy(this.config!))
	}

	download() {
		downloadFile('ai-sdk-panel.config', JSON.stringify(this.config, null, 6), 'json')
	}

	async upload() {
		const files = await uploadFile({ accept: '.json' })

		if (!files) return

		const file = await (files as File).text()

		let upload_error = ''

		try {
			const json = JSON.parse(file)
			const res = validate(json, schema)

			if (res.valid) {
				this.current_tab = 0
				this.current_model = null
				this.adding_model = false
				this.config = null

				this.config = deepmerge($copy(this.config), json)
			}

			if (res.errors.length) {
				console.log(res.errors)
				upload_error = res.errors.reduce((total, item, index) => {
					total += item.message

					if (index !== res.errors.length - 1) total += ' | '

					return total
				}, $t('provider.upload.validate_error_prefix'))
			}
		} catch (err) {
			if ((err as Error).message) upload_error = $t('provider.upload.upload_error')
		}

		if (upload_error) {
			alert({
				icon: 'error',
				info: true,
				title: $t('provider.upload.import_error_title'),
				desc: $t('provider.upload.import_error_desc', { error: upload_error })
			})
		}
	}
}
