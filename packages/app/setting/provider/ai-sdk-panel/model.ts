import { arrayMove } from '@dnd-kit/sortable'
import { deepmerge } from 'deepmerge-ts'
import { validate } from 'jsonschema'
import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { downloadFile, uploadFile } from '@/utils'

import schema from './schema.json'

import type { DragEndEvent } from '@dnd-kit/core'
import type { ArgsInit, Config, ConfigProvider, IPropsPanel } from './types'

@injectable()
export default class Index {
	config = null as Config | null
	current_tab = 0
	current_model = null as number | null
	test = { loading: false, res: null as boolean | null }
	adding_model = false
	adding_provider = false
	upload_error = ''

	timer_test = null as NodeJS.Timeout | null
	onChange = null as unknown as IPropsPanel['onChange']
	onTest = null as unknown as IPropsPanel['onTest']

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

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	init(args: ArgsInit) {
		const { config, onChange, onTest } = args

		this.config = config

		this.onChange = onChange
		this.onTest = onTest
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

	onChangeCustomProviders(v: Config['custom_providers']) {
		this.config!.custom_providers = v

		this.onChangeConfig()
	}

	onChangeConfig() {
		this.onChange($copy(this.config!))
	}

	download() {
		downloadFile('ai-sdk-panel.config', JSON.stringify(this.config, null, 6), 'json')
	}

	async onTestModel() {
		if (this.timer_test) clearTimeout(this.timer_test)

		this.test = { loading: true, res: null }

		const res = await this.onTest!(this.provider)

		this.test = { loading: false, res }

		this.timer_test = setTimeout(() => {
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

				this.config = deepmerge($copy(this.config), json)
			}

			if (res.errors.length) {
				// this.upload_error = res.errors.reduce((total, item, index) => {
				// 	total += this.validate_error.replace(
				// 		'{{property}}',
				// 		`${item.property.replace('instance.', '')}`
				// 	)
				// 	if (index !== res.errors.length - 1) total += ' | '
				// 	return total
				// }, this.validate_error_prefix)
			}
		} catch (err) {
			if ((err as Error).message) this.upload_error = this.upload_error
		}
	}
}
