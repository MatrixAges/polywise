import { Settings } from '@/models'

export interface IPropsSidebar extends Pick<Settings, 'toggleSidebar' | 'toggleSettings'> {
	fold: Settings['sidebar_fold']
}
