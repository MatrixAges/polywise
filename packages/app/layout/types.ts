import { Settings } from '@/models'

export interface IPropsTab {}

export interface IPropsPage {}

export interface IPropsPanel {}

export interface IPropsSidebar extends Pick<Settings, 'toggleSidebar' | 'toggleSettings'> {
	fold: Settings['sidebar_fold']
}
