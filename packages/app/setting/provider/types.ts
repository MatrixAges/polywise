import type { DragEndEvent } from '@dnd-kit/core'
import type { Control, UseFieldArrayRemove, UseFieldArrayUpdate, UseFormRegister } from 'react-hook-form'
import type { default as DataModel } from './model'

export interface IPropsProviders {
	config: Config
	onChange: (v: Config) => void
	onTest?: (provider: PresetProvider | SpecialProvider) => Promise<boolean>
}

export interface ArgsInit extends Pick<IPropsProviders, 'config' | 'onChange' | 'onTest'> {}

export interface IPropsTab {
	items: Array<string>
	current_tab: DataModel['current_tab']
	onChangeCurrentTab: (v: number) => void
	onDragProvider: DataModel['onDragProvider']
}

export interface IPropsTabItem extends Pick<IPropsTab, 'onChangeCurrentTab'> {
	index: number
	item: IPropsTab['items'][number]
	display_name: string
	active: boolean
}

export interface IPropsForm {
	provider: Config['providers'][number]
	test?: DataModel['test']
	current_model: DataModel['current_model']
	adding_model: DataModel['adding_model']
	custom?: boolean
	onTest?: DataModel['onTest']
	onChangeProvider: DataModel['onChangeProvider']
	download?: DataModel['download']
	upload?: DataModel['upload']
	onChangeCurrentModel: (v: number | null) => void
	toggleAddingModel: () => void
	onDisableProvider?: () => void
	onRemoveProvider?: () => void
}

export interface IPropsFormAPIKey extends Pick<IPropsForm, 'test' | 'onTest'> {
	title: string
	api_key: IPropsForm['provider']['api_key']
	custom?: boolean
	register: UseFormRegister<IPropsForm['provider']>
}

export interface IPropsFormBaseUrl {
	title: string
	base_url: IPropsForm['provider']['base_url']
	custom?: boolean
	register: UseFormRegister<IPropsForm['provider']>
}

export interface IPropsFormCustomFields {
	custom_fields: SpecialProvider['custom_fields']
	register: UseFormRegister<IPropsForm['provider']>
}

export interface IPropsFormModels extends Pick<IPropsForm, 'current_model' | 'onChangeCurrentModel'> {
	models: SpecialProvider['models']
	control: Control<IPropsForm['provider']>
	custom?: boolean
	remove: UseFieldArrayRemove
	register: UseFormRegister<IPropsForm['provider']>
	onDragModel: (args: DragEndEvent) => void
}

export interface IPropsFormModel extends Pick<IPropsFormModels, 'control' | 'onChangeCurrentModel' | 'remove'> {
	index: number
	item: Model
	desc_keys: Array<string>
	custom?: boolean
	editing?: boolean
}

export interface IPropsFormModelForm {
	control: Control<IPropsForm['provider']> | Control<Model>
	index?: number
	item?: Model
	adding_model?: DataModel['adding_model']
	register: UseFormRegister<IPropsForm['provider']> | UseFormRegister<Model>
}

export interface IPropsFormModelFormFeatures {}

export interface IPropsCustom {
	custom_providers: Config['custom_providers']
	onChangeCustomProviders: DataModel['onChangeCustomProviders']
}

export interface IPropsCustomForm {
	toggle: () => void
	checkExist: (name: string) => boolean
	onAddProvider: (v: Provider) => void
}

export interface IPropsCustomProvider {
	index: number
	item: Provider
	update: UseFieldArrayUpdate<{ providers: Array<Provider> }>
	remove: UseFieldArrayRemove
}

export interface IPropsDisabled {
	items: Array<string>
	onEnableProvider: DataModel['onEnableProvider']
}

export interface Config {
	providers: Array<ConfigProvider>
	custom_providers?: Array<Provider>
}

export type ConfigProvider = PresetProvider | SpecialProvider

export interface Provider {
	name: string
	api_key: string
	base_url: string
	enabled: boolean
	models: Array<Model>
	headers?: string
}

export interface PresetProvider extends Omit<Provider, 'base_url'> {
	api_key: string
	base_url?: string
}

export interface SpecialProvider extends Partial<Omit<Provider, 'name' | 'enabled'>> {
	name: string
	enabled: boolean
	custom_fields?: Record<string, string>
}

export interface Model {
	name: string
	id: string
	enabled: boolean
	fid?: string
	desc?: string
	features?: Features
	fee?: { output?: number; input?: number }
}

export interface Features {
	vision?: boolean
	voice?: boolean
	function_calling?: boolean
	structured_output?: boolean
	reasoning?: boolean
	reasoning_optional?: boolean
	web_search?: boolean
	image_input?: boolean
	image_output?: boolean
	embedding?: boolean
	reranking?: boolean
}

export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>
		}
	: T

export type DeepRequired<T> = T extends object
	? {
			[P in keyof T]-?: DeepRequired<T[P]>
		}
	: T
