import type { Model, Provider, ProviderConfig, SpecialProvider } from '@core/types'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Control, UseFieldArrayRemove, UseFieldArrayUpdate, UseFormRegister } from 'react-hook-form'
import type M from './model'

export interface IPropsPanel {
	config: ProviderConfig
	onChange: (v: ProviderConfig) => void
}

export interface ArgsInit extends Pick<IPropsPanel, 'config' | 'onChange'> {}

export interface ApiTestState {
	loading: boolean
	res: boolean | null
}

export interface IPropsTab {
	items: Array<string>
	currentTab: M['current_tab']
	builtinProviders: M['builtin_providers']
	onChangeCurrentTab: (v: number) => void
	onDragProvider: M['onDragProvider']
	onAddBuiltinProvider: M['onAddBuiltinProvider']
	download?: M['download']
	upload?: M['upload']
}

export interface IPropsTabItem extends Pick<IPropsTab, 'onChangeCurrentTab'> {
	index: number
	item: IPropsTab['items'][number]
	displayName: string
	active: boolean
}

export interface IPropsForm {
	allProviders?: ProviderConfig['providers']
	provider: ProviderConfig['providers'][number]
	currentModel: M['current_model']
	addingModel: M['adding_model']
	custom?: boolean
	onChangeProvider: M['onChangeProvider']
	onChangeCurrentModel: (v: number | null) => void
	toggleAddingModel: () => void
	onDisableProvider?: () => void
	onRemoveProvider?: () => void
}

export interface IPropsFormAPIKey {
	title: string
	apiKey: IPropsForm['provider']['apiKey']
	custom?: boolean
	test: ApiTestState
	onTest: () => void
	register: UseFormRegister<IPropsForm['provider']>
}

export interface IPropsFormBaseUrl {
	title: string
	baseURL: IPropsForm['provider']['baseURL']
	custom?: boolean
	register: UseFormRegister<IPropsForm['provider']>
}

export interface IPropsFormCustomFields {
	customFields: SpecialProvider['custom_fields']
	register: UseFormRegister<IPropsForm['provider']>
}

export interface IPropsFormModels extends Pick<IPropsForm, 'currentModel' | 'onChangeCurrentModel'> {
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
	custom?: boolean
	editing?: boolean
}

export interface IPropsFormModelForm {
	control: Control<IPropsForm['provider']> | Control<Model>
	index?: number
	item?: Model
	addingModel?: M['adding_model']
	register: UseFormRegister<IPropsForm['provider']> | UseFormRegister<Model>
}

export interface IPropsCustom {
	customProviders: ProviderConfig['custom_providers']
	onChangeCustomProviders: M['onChangeCustomProviders']
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
	onEnableProvider: M['onEnableProvider']
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
