import { arrayMove } from '@dnd-kit/sortable'
import { deepmerge } from 'deepmerge-ts'
import { validate } from 'jsonschema'
import { ref } from 'valtio'
import { deepClone } from 'valtio/utils'

import schema from '@/schema.json'
import { autoBind, downloadFile, uploadFile } from '@/utils'

import type { DragEndEvent } from '@dnd-kit/core'
import type { ArgsInit, Config, ConfigProvider, IPropsProviders, ProvidersLocales } from './types'

export default class Index {
	config = null as Config | null
	current_tab = 0
	current_model = null as number | null
	test = { loading: false, res: null as boolean | null }
	adding_model = false
	adding_provider = false
	upload_error = ''

	refs = ref({
		locales_upload: {} as ProvidersLocales['upload'],
		timer_test: null as NodeJS.Timeout | null,
		onChange: null as unknown as IPropsProviders['onChange'],
		onTest: null as unknown as IPropsProviders['onTest']
	})

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

	get tabs() {
		if (!this.providers.enabled) return []

		return this.providers.enabled.map(item => item.name).concat('custom', 'disabled')
	}

	get provider() {
		return this.providers.enabled?.[this.current_tab]!
	}

	init(args: ArgsInit) {
		const { locales_upload, config, onChange, onTest } = args

		this.config = deepClone(config)

		this.refs.locales_upload = locales_upload
		this.refs.onChange = onChange
		this.refs.onTest = onTest

		autoBind(this)
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

		this.onChange()
	}

	onToggleProvider() {
		if (this.providers.enabled!.length <= 3) return

		this.setEnabledProvider({ enabled: false })

		if (this.current_tab === this.providers.enabled!.length) {
			this.current_tab = this.current_tab - 1
		}

		this.onChange()
	}

	onEnableProvider(name: string) {
		const index = this.config!.providers.findIndex(item => item.name === name)!

		this.config!.providers[index].enabled = true
		this.current_tab += 1

		this.onChange()
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

		this.onChange()
	}

	onChangeCustomProviders(v: Config['custom_providers']) {
		this.config!.custom_providers = v

		this.onChange()
	}

	onChange() {
		this.refs.onChange(deepClone(this.config!))
	}

	download() {
		downloadFile('ai-sdk-panel.config', JSON.stringify(this.config, null, 6), 'json')
	}

	async onTest() {
		if (this.refs.timer_test) clearTimeout(this.refs.timer_test)

		this.test = { loading: true, res: null }

		const res = await this.refs.onTest!(this.provider)

		this.test = { loading: false, res }

		this.refs.timer_test = setTimeout(() => {
			this.test.res = null
		}, 2400)
	}

	async upload() {
		const files = await uploadFile({ accept: '.json' })

		if (!files) return

		const file = await (files as File).text()

		try {
			const json = JSON.parse(file)
			const res = validate(json, schema)

			if (res.valid) {
				this.current_tab = 0
				this.current_model = null
				this.adding_model = false
				this.config = null

				this.config = deepmerge(deepClone(this.config), json)
			}

			if (res.errors.length)
				this.upload_error = res.errors.reduce((total, item, index) => {
					total += this.refs.locales_upload.validate_error.replace(
						'{{property}}',
						`${item.property.replace('instance.', '')}`
					)

					if (index !== res.errors.length - 1) total += ' | '

					return total
				}, this.refs.locales_upload.validate_error_prefix)
		} catch (err) {
			if ((err as Error).message) this.upload_error = this.refs.locales_upload.upload_error
		}

		setTimeout(() => {
			this.upload_error = ''
		}, 6000)
	}
}
