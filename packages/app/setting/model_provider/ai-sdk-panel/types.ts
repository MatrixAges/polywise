import type { Model, PresetProvider, Provider, ProviderConfig, SpecialProvider } from '@core/types'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Control, UseFieldArrayRemove, UseFieldArrayUpdate, UseFormRegister } from 'react-hook-form'
import type M from './model'

export interface IPropsPanel {
	config: ProviderConfig
	onChange: (v: ProviderConfig) => void
	onTest?: (provider: PresetProvider | SpecialProvider) => Promise<boolean>
}

export interface ArgsInit extends Pick<IPropsPanel, 'config' | 'onChange' | 'onTest'> {}

export interface IPropsTab {
	items: Array<string>
	current_tab: M['current_tab']
	builtin_providers: M['builtin_providers']
	onChangeCurrentTab: (v: number) => void
	onDragProvider: M['onDragProvider']
	onAddBuiltinProvider: M['onAddBuiltinProvider']
	download?: M['download']
	upload?: M['upload']
}

export interface IPropsTabItem extends Pick<IPropsTab, 'onChangeCurrentTab'> {
	index: number
	item: IPropsTab['items'][number]
	display_name: string
	active: boolean
}

export interface IPropsForm {
	all_providers: ProviderConfig['providers']
	provider: ProviderConfig['providers'][number]
	test?: M['test']
	current_model: M['current_model']
	adding_model: M['adding_model']
	custom?: boolean
	onTest?: M['onTestModel']
	onChangeProvider: M['onChangeProvider']
	onChangeCurrentModel: (v: number | null) => void
	toggleAddingModel: () => void
	onDisableProvider?: () => void
	onRemoveProvider?: () => void
}

export interface IPropsFormAPIKey extends Pick<IPropsForm, 'test' | 'onTest'> {
	title: string
	apiKey: IPropsForm['provider']['apiKey']
	custom?: boolean
	register: UseFormRegister<IPropsForm['provider']>
}

export interface IPropsFormBaseUrl {
	title: string
	baseURL: IPropsForm['provider']['baseURL']
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
	custom?: boolean
	editing?: boolean
}

export interface IPropsFormModelForm {
	control: Control<IPropsForm['provider']> | Control<Model>
	index?: number
	item?: Model
	adding_model?: M['adding_model']
	register: UseFormRegister<IPropsForm['provider']> | UseFormRegister<Model>
}

export interface IPropsCustom {
	custom_providers: ProviderConfig['custom_providers']
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
